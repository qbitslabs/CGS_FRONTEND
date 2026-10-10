/* Pick a global WhatsApp template and queue one send job per recipient. */
import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { PageHeader, Button, Badge, Card, SearchInput, EmptyState, Avatar, useToast } from '../../components/ui';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../services/patient.service';
import { LeadService } from '../../services/lead.service';
import { BillingService } from '../../services/billing.service';
import { OutboundPreviewItem, OutboundService, OutboundTemplate } from '../../services/outbound.service';
import { Appointment, Invoice, Lead, Patient } from '../../types';
import { formatDate } from '../../utils/format';

export const OutboundPage: React.FC = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState<OutboundTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<OutboundPreviewItem[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const template = templates.find((item) => item.key === templateKey);

  useEffect(() => {
    OutboundService.listTemplates()
      .then((rows) => {
        setTemplates(rows);
        setTemplateKey(rows[0]?.key || '');
      })
      .catch((err: Error) => toast.error(err.message || 'Could not load templates'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelected([]);
    setPreview([]);
    setQuery('');
    if (!template) return;
    if (template.recipientKind === 'appointment') {
      AppointmentService.getAppointments()
        .then(setAppointments)
        .catch((err: Error) => toast.error(err.message || 'Could not load appointments'));
    } else if (template.recipientKind === 'lead') {
      LeadService.getLeads({ page: 1, pageSize: 50, source: 'Website' })
        .then((result) => setLeads(result.data))
        .catch((err: Error) => toast.error(err.message || 'Could not load landing enquiries'));
    } else if (template.recipientKind === 'invoice') {
      BillingService.getInvoices({ page: 1, pageSize: 50 })
        .then((result) => setInvoices(result.data))
        .catch((err: Error) => toast.error(err.message || 'Could not load invoices'));
    } else {
      PatientService.getPatients({ page: 1, pageSize: 50 })
        .then((result) => setPatients(result.data))
        .catch((err: Error) => toast.error(err.message || 'Could not load patients'));
    }
  }, [template?.key]);

  const rows = useMemo(() => {
    if (!template) return [];
    const source =
      template.recipientKind === 'appointment'
        ? appointments.slice(0, 50).map((item) => ({
            id: item.id,
            title: item.patientName,
            phone: item.patientPhone,
            meta: `${formatDate(item.date)} ${item.time} · ${item.doctorName}`,
          }))
        : template.recipientKind === 'lead'
          ? leads.map((item) => ({
              id: item.id,
              title: item.name,
              phone: item.phone,
              meta: `${item.interestedService || 'Enquiry'}${item.preferredDoctor ? ` · ${item.preferredDoctor}` : ''}`,
            }))
          : template.recipientKind === 'invoice'
            ? invoices.map((item) => ({
                id: item.id,
                title: item.patientName,
                phone: item.patientPhone,
                meta: `${item.invoiceNumber} · Rs. ${Number(item.total || 0).toLocaleString('en-IN')}`,
              }))
            : patients.map((item) => ({
              id: item.id,
              title: item.name,
              phone: item.phone,
              meta: 'Patient',
            }));
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((row) => `${row.title} ${row.phone} ${row.meta}`.toLowerCase().includes(q));
  }, [template, appointments, patients, leads, invoices, query]);

  const body = () =>
    template?.recipientKind === 'patient'
      ? { templateKey, patientIds: selected }
      : template?.recipientKind === 'lead'
        ? { templateKey, leadIds: selected }
        : template?.recipientKind === 'invoice'
          ? { templateKey, invoiceIds: selected }
          : { templateKey, appointmentIds: selected };

  const onPreview = async () => {
    if (!selected.length) {
      toast.error('Select at least one recipient');
      return;
    }
    setBusy(true);
    try {
      const result = await OutboundService.preview(body());
      setPreview(result.items);
    } catch (err: any) {
      toast.error(err.message || 'Preview failed');
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (!selected.length) {
      toast.error('Select at least one recipient');
      return;
    }
    setBusy(true);
    try {
      const result = await OutboundService.send(body());
      toast.success(`Queued ${result.queued.length}. Skipped ${result.skipped.length}.`);
      setSelected([]);
      setPreview([]);
    } catch (err: any) {
      toast.error(err.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const visibleIds = rows.map((row) => row.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="WhatsApp outbound"
        description="Bills and old-patient reactivation are sent from here. Reminders, follow-ups, missed visits, and landing enquiries go out on their own."
        badge={
          selected.length > 0 ? (
            <Badge variant="success" size="sm">
              {selected.length} selected
            </Badge>
          ) : undefined
        }
      />

      <div className="outbound-layout">
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-slate-500)', marginBottom: 10 }}>Template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((item) => {
              const active = item.key === templateKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTemplateKey(item.key)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 12,
                    border: active ? '1px solid var(--c-primary-500, #0f766e)' : '1px solid var(--border-light)',
                    background: active ? 'var(--c-primary-50, #f0fdfa)' : '#fff',
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{item.purpose}</strong>
                    <Badge variant={item.status === 'APPROVED' ? 'success' : 'warning'} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-slate-500)' }}>{item.metaName}</div>
                </button>
              );
            })}
          </div>

          {template && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {template.documentHeader && template.trySessionFirst
                  ? 'The invoice PDF is sent as a normal WhatsApp file first. The template is used only if the 24-hour chat window is closed.'
                  : template.trySessionFirst
                    ? 'A normal message is tried first. The template is used only if the 24-hour chat window is closed.'
                    : 'This template is always sent as the approved Meta message.'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {template.parameters.map((item) => (
                  <Badge key={item.index} variant="neutral" size="sm">
                    {`{{${item.index}}} ${item.label}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card padding="none">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              padding: '16px 16px 12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Recipients</div>
              <div style={{ fontSize: 12, color: 'var(--c-slate-500)' }}>
                {template?.recipientKind === 'lead'
                  ? 'Landing page enquiries'
                  : template?.recipientKind === 'patient'
                    ? 'Patients'
                    : template?.recipientKind === 'invoice'
                      ? 'Invoices'
                      : 'Appointments'}
              </div>
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder="Search name or phone" containerStyle={{ maxWidth: 260 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 10px' }}>
            <button
              type="button"
              onClick={() =>
                setSelected((current) =>
                  allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]
                )
              }
              style={{ background: 'none', border: 'none', color: 'var(--c-primary-700, #0f766e)', cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              {allVisibleSelected ? 'Clear visible' : 'Select visible'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--c-slate-500)' }}>{rows.length} shown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 16px', maxHeight: 460, overflow: 'auto' }}>
            {rows.map((row) => {
              const on = selected.includes(row.id);
              return (
                <div
                  key={row.id}
                  className="outbound-recipient"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(row.id)}
                  style={{
                    borderColor: on ? 'var(--c-primary-400, #2dd4bf)' : 'var(--border-light)',
                    background: on ? 'var(--c-primary-50, #f0fdfa)' : '#fff',
                  }}
                >
                  <input type="checkbox" checked={on} readOnly tabIndex={-1} />
                  <Avatar name={row.title || 'Patient'} size="sm" />
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{row.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-slate-500)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.phone} · {row.meta}
                    </div>
                  </span>
                </div>
              );
            })}
            {!rows.length && (
              <EmptyState
                icon={<MessageCircle size={28} color="var(--c-slate-400)" />}
                title="No recipients"
                description="Nothing matches this template yet. Try another search or template."
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: 16,
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <Button variant="outline" onClick={onPreview} disabled={busy || !selected.length}>
              Preview
            </Button>
            <Button onClick={onSend} disabled={busy || !selected.length} leftIcon={<Send size={14} />}>
              Queue send
            </Button>
          </div>
        </Card>
      </div>

      {preview.length > 0 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Preview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {preview.map((item) => (
              <div key={item.recordId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {item.participantName}{' '}
                  <span style={{ fontWeight: 400, color: 'var(--c-slate-500)' }}>{item.phone}</span>
                </div>
                <div
                  style={{
                    background: '#dcf8c6',
                    color: '#111',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '10px 12px',
                    fontSize: 13,
                    lineHeight: 1.45,
                    maxWidth: 360,
                  }}
                >
                  {item.preview}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
