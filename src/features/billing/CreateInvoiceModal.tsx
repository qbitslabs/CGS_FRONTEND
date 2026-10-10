/* Modal to raise a paid clinic invoice after a completed appointment.
 * Line items and tax; from appointments the receipt is sent on WhatsApp. */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, useToast } from '../../components/ui';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../services/patient.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { ClinicService, Doctor, Invoice, PaymentMethod } from '../../types';

interface LineItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetPatientId?: string;
  presetService?: string;
  appointmentId?: string;
  treatingDoctorId?: string;
  autoSendWhatsApp?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  onCreated?: (invoice: Invoice) => void | Promise<void>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  presetPatientId,
  presetService,
  appointmentId,
  treatingDoctorId,
  autoSendWhatsApp = false,
  title = 'Create Invoice',
  description = 'Generate a treatment invoice. Creating it records the payment as received.',
  submitLabel = 'Create Invoice',
  onCreated,
}) => {
  const toast = useToast();
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [patientId, setPatientId] = useState(presetPatientId || '');
  const [items, setItems] = useState<LineItem[]>([{ name: '', quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState('0');
  const [taxPercent, setTaxPercent] = useState('18');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState(treatingDoctorId || '');
  const [sendOnWhatsApp, setSendOnWhatsApp] = useState(autoSendWhatsApp);

  useEffect(() => {
    if (!isOpen) return;
    setPatientId(presetPatientId || '');
    setDoctorId(treatingDoctorId || '');
    setSendOnWhatsApp(autoSendWhatsApp);
    PatientService.getPatients({ page: 1, pageSize: 100 })
      .then((res) => setPatients(res.data.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setPatients([]));
    ClinicServiceApi.getDoctors()
      .then((list) => setDoctors(list.filter((doctor) => doctor.isActive !== false)))
      .catch(() => setDoctors([]));
    ClinicServiceApi.getServices()
      .then((list) => {
        setServices(list.filter((s) => s.isActive !== false));
        if (presetService) {
          const match = list.find((s) => s.name.toLowerCase() === presetService.toLowerCase());
          setItems([{ name: match?.name || presetService, quantity: 1, unitPrice: match?.price ?? 0 }]);
        }
      })
      .catch(() => {
        setServices([]);
        if (presetService) {
          setItems([{ name: presetService, quantity: 1, unitPrice: 0 }]);
        }
      });
  }, [isOpen, presetPatientId, presetService, treatingDoctorId, autoSendWhatsApp]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0),
    [items]
  );
  const discountValue = Number(discount) || 0;
  const taxPct = Number(taxPercent) || 0;
  const taxAmount = ((subtotal - discountValue) * taxPct) / 100;
  const total = Math.max(0, subtotal - discountValue + taxAmount);

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const applyService = (index: number, serviceName: string) => {
    const service = services.find((s) => s.name === serviceName);
    updateItem(index, {
      name: serviceName,
      unitPrice: service?.price ?? 0,
    });
  };

  const handleSubmit = async () => {
    const validItems = items.filter((item) => item.name.trim() && item.quantity > 0);
    if (!patientId) {
      toast.error('Select a patient');
      return;
    }
    if (validItems.length === 0) {
      toast.error('Add at least one procedure');
      return;
    }
    if (!doctorId) {
      toast.error('Select the treating doctor');
      return;
    }
    setIsSaving(true);
    try {
      const created = await BillingService.createInvoice({
        patientId,
        patientName: patients.find((p) => p.id === patientId)?.name || '',
        patientPhone: '',
        service: validItems[0].name,
        services: validItems.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.quantity) * Number(item.unitPrice),
        })),
        subtotal,
        discount: discountValue,
        tax: taxAmount,
        taxPercent: taxPct,
        total,
        paidAmount: total,
        remainingAmount: 0,
        paymentStatus: 'Paid',
        paymentMethod,
        notes,
        createdDate: new Date().toISOString().split('T')[0],
        appointmentId,
        treatingDoctorId: doctorId,
      });
      toast.success('Invoice created', 'Treatment invoice added to the ledger.');
      if (sendOnWhatsApp) {
        try {
          await BillingService.sendInvoiceWhatsApp(created.id);
          toast.success('Sent on WhatsApp', 'The invoice PDF was sent to the patient.');
        } catch (sendErr: any) {
          toast.error(sendErr?.message || 'Invoice saved, but WhatsApp send failed.');
        }
      }
      setItems([{ name: '', quantity: 1, unitPrice: 0 }]);
      setDiscount('0');
      setNotes('');
      await onCreated?.(created);
      onClose();
    } catch (err) {
      toast.error('Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSaving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Select
          label="Patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          options={[
            { value: '', label: 'Select patient' },
            ...patients.map((p) => ({ value: p.id, label: p.name })),
          ]}
          disabled={Boolean(presetPatientId)}
        />

        {items.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px', gap: '8px' }}>
            {services.length > 0 ? (
              <Select
                label={index === 0 ? 'Procedure' : undefined}
                value={item.name}
                onChange={(e) => applyService(index, e.target.value)}
                options={[
                  { value: '', label: 'Select or type a procedure' },
                  ...services.map((s) => ({ value: s.name, label: s.name })),
                  ...(item.name && !services.some((s) => s.name === item.name)
                    ? [{ value: item.name, label: item.name }]
                    : []),
                ]}
              />
            ) : (
              <Input
                label={index === 0 ? 'Procedure' : undefined}
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Procedure name"
              />
            )}
            <Input
              label={index === 0 ? 'Qty' : undefined}
              type="number"
              min="1"
              value={String(item.quantity)}
              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
            />
            <Input
              label={index === 0 ? 'Unit ₹' : undefined}
              type="number"
              min="0"
              value={String(item.unitPrice)}
              onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
            />
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { name: '', quantity: 1, unitPrice: 0 }])}>
          Add line item
        </Button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Input label="Discount (₹)" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input
            label="GST %"
            type="number"
            min="0"
            max="100"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'UPI', label: 'UPI' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
            ]}
          />
        </div>

        <Select
          label="Treating doctor"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          options={[
            { value: '', label: 'Select doctor' },
            ...doctors.map((doctor) => ({ value: doctor.id, label: doctor.name })),
          ]}
        />
        <Select
          label="Send this bill to the patient on WhatsApp?"
          value={sendOnWhatsApp ? 'yes' : 'no'}
          onChange={(e) => setSendOnWhatsApp(e.target.value === 'yes')}
          options={[
            { value: 'no', label: 'No, save the bill only' },
            { value: 'yes', label: 'Yes, send it on WhatsApp' },
          ]}
        />

        <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" />

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Subtotal ₹{subtotal.toLocaleString('en-IN')} · GST {taxPct}% ₹{taxAmount.toLocaleString('en-IN')} · Total ₹
          {total.toLocaleString('en-IN')}
        </div>
      </div>
    </Modal>
  );
};
