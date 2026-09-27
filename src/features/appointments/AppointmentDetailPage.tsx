/* Single-appointment detail: status, patient, doctor, and visit notes.
 * Loads the visit from CGS; used after a list-row click. */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Phone,
  CheckCircle2,
  RotateCcw,
  XCircle,
  CalendarOff,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  Modal,
  Input,
  Select,
  Skeleton,
  ErrorState,
  useToast,
} from '../../components/ui';
import { AppointmentService } from '../../services/appointment.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { Appointment, AppointmentStatus } from '../../types';
import { CreateInvoiceModal } from '../billing/CreateInvoiceModal';

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Reschedule Modal State
  const [isCompleteInvoiceOpen, setIsCompleteInvoiceOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSameDayAllowed, setIsSameDayAllowed] = useState(true);
  const [sameDayNotice, setSameDayNotice] = useState('');
  const [minRescheduleDate, setMinRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{
    isDoctorOnLeave?: boolean;
    isDoctorOffDuty?: boolean;
    leaveReason?: string;
    offDutyReason?: string;
    availableSlots: string[];
    bookedSlots: string[];
  }>({ availableSlots: [], bookedSlots: [] });
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchApt = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const apt = await AppointmentService.getAppointmentById(id);
        setAppointment(apt);
        setNewDate(apt.date);
        setNewTime(apt.time);
      } catch (err: any) {
        setError(err.message || 'Appointment not found');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApt();
  }, [id]);

  const evaluateDoctorTodaySlots = async (docId?: string): Promise<{ allowed: boolean; notice: string; latestEndTimeStr: string }> => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayOfWeek = dayNames[new Date().getDay()];

    try {
      const docs = await ClinicServiceApi.getDoctors();
      const doc = docs.find((d) => d.id === docId || d.name === appointment?.doctorName) || docs[0];

      if (!doc) {
        return { allowed: true, notice: 'Same-day reschedule available.', latestEndTimeStr: '08:00 PM' };
      }

      if (doc.availability?.days && doc.availability.days.length > 0 && !doc.availability.days.includes(todayDayOfWeek)) {
        return {
          allowed: false,
          notice: `Doctor does not consult on ${todayDayOfWeek}s. Rescheduling is available for upcoming working days.`,
          latestEndTimeStr: '',
        };
      }

      const hoursStr = doc.availability?.hours || '09:00 AM - 05:00 PM';
      const ranges = hoursStr.split(',').map((s) => s.trim()).filter(Boolean);
      let maxEndMinutes = 0;
      let latestEndStr = '05:00 PM';

      const parseToMin = (t: string) => {
        const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 0;
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
        if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };

      for (const r of ranges) {
        const parts = r.split('-').map((s) => s.trim());
        if (parts.length >= 2) {
          const endMin = parseToMin(parts[1]);
          if (endMin > maxEndMinutes) {
            maxEndMinutes = endMin;
            latestEndStr = parts[1];
          }
        }
      }

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      if (nowMinutes < maxEndMinutes) {
        return {
          allowed: true,
          notice: `Patient arrived before shift closing! Same-day reschedule available (Doctor in clinic until ${latestEndStr}). You can also choose future dates.`,
          latestEndTimeStr: latestEndStr,
        };
      } else {
        return {
          allowed: false,
          notice: `Doctor's consultation slots for today closed at ${latestEndStr}. Rescheduling is available for upcoming working days.`,
          latestEndTimeStr: latestEndStr,
        };
      }
    } catch (e) {
      return { allowed: true, notice: 'Reschedule available.', latestEndTimeStr: '08:00 PM' };
    }
  };

  const handleOpenReschedule = async () => {
    if (!appointment) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const todayEval = await evaluateDoctorTodaySlots(appointment.doctorId);
    setIsSameDayAllowed(todayEval.allowed);
    setSameDayNotice(todayEval.notice);

    if (todayEval.allowed) {
      setMinRescheduleDate(todayStr);
      setNewDate(todayStr);
    } else {
      setMinRescheduleDate(tomorrowStr);
      setNewDate(tomorrowStr);
    }

    setRescheduleReason('Patient arrived / missed slot - Rescheduled');
    setIsRescheduleModalOpen(true);
  };

  // Fetch slots whenever newDate changes
  useEffect(() => {
    if (!isRescheduleModalOpen || !appointment || !newDate) return;
    const fetchSlots = async () => {
      setIsLoadingRescheduleSlots(true);
      try {
        const res = await AppointmentService.getDoctorAvailability(appointment.doctorId, newDate);
        let slots = res.availableSlots || [];

        const todayStr = new Date().toISOString().split('T')[0];
        if (newDate === todayStr) {
          const now = new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const parseToMin = (t: string) => {
            const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!m) return 0;
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
            if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
            return h * 60 + min;
          };
          slots = slots.filter((s) => parseToMin(s) > nowMin);
        }

        setRescheduleSlots({
          isDoctorOnLeave: res.isDoctorOnLeave,
          isDoctorOffDuty: res.isDoctorOffDuty,
          leaveReason: res.leaveReason,
          offDutyReason: res.offDutyReason,
          availableSlots: slots,
          bookedSlots: res.bookedSlots || [],
        });

        if (slots.length > 0) {
          setNewTime(slots[0]);
        } else {
          setNewTime('');
        }
      } catch (err) {
        console.error('Failed to get slots for reschedule', err);
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    };
    fetchSlots();
  }, [isRescheduleModalOpen, appointment, newDate]);

  const handleUpdateStatus = async (status: AppointmentStatus) => {
    if (!appointment) return;
    if (status === 'Completed') {
      setIsCompleteInvoiceOpen(true);
      return;
    }
    try {
      const updated = await AppointmentService.updateStatus(appointment.id, status);
      setAppointment(updated);
      toast.success('Status Updated', `Appointment marked as ${status}.`);
    } catch (err) {
      toast.error('Failed to update appointment status');
    }
  };

  const handleCompleteInvoiceCreated = async () => {
    if (!appointment) return;
    try {
      const updated = await AppointmentService.updateStatus(appointment.id, 'Completed');
      setAppointment(updated);
      toast.success('Appointment Completed', 'Invoice sent on WhatsApp and appointment marked complete.');
    } catch (err) {
      toast.error('Invoice saved, but completing the appointment failed.');
    }
  };

  const handleReschedule = async () => {
    if (!appointment || !newDate || !newTime) {
      toast.error('Please select an available time slot');
      return;
    }
    setIsSavingReschedule(true);
    try {
      const updated = await AppointmentService.reschedule(
        appointment.id,
        newDate,
        newTime,
        rescheduleReason || 'Rescheduled by clinic staff',
        appointment.doctorId
      );
      setAppointment(updated);
      setIsRescheduleModalOpen(false);
      toast.success('Appointment Rescheduled', `New slot: ${newDate} at ${newTime}`);
    } catch (err) {
      toast.error('Failed to reschedule appointment');
    } finally {
      setIsSavingReschedule(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    try {
      const updated = await AppointmentService.cancelAppointment(
        appointment.id,
        cancelReason || 'Cancelled by patient request'
      );
      setAppointment(updated);
      setIsCancelModalOpen(false);
      toast.info('Appointment Cancelled', 'Slot released.');
    } catch (err) {
      toast.error('Failed to cancel appointment');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton width="30%" height={32} style={{ marginBottom: '16px' }} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <ErrorState
        title="Appointment Not Found"
        message={error || "The appointment booking you're looking for doesn't exist."}
        onRetry={() => navigate('/appointments')}
      />
    );
  }

  const isNotCompletedOrMissed = appointment.status === 'Not Completed' || appointment.status === 'No Show' || appointment.isOverdue;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Appointments', to: '/appointments' },
          { label: `${appointment.patientName} (${appointment.date})` },
        ]}
        title={`Appointment: ${appointment.patientName}`}
        badge={<StatusBadge status={appointment.status} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Confirm Booking only shows for initial Scheduled status, NEVER for Not Completed/Missed */}
            {!isNotCompletedOrMissed && appointment.status === 'Scheduled' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('Confirmed')}
                leftIcon={<CheckCircle2 size={14} />}
              >
                Confirm Booking
              </Button>
            )}

            {appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdateStatus('Completed')}
                leftIcon={<CheckCircle2 size={14} />}
              >
                Mark Completed
              </Button>
            )}

            {appointment.status !== 'Cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenReschedule}
                leftIcon={<RotateCcw size={14} />}
              >
                Reschedule
              </Button>
            )}

            {appointment.status !== 'Cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                leftIcon={<XCircle size={14} />}
                style={{ color: 'var(--status-error)' }}
              >
                Cancel Appointment
              </Button>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Main Appointment Details Card */}
        <Card padding="md">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--c-primary-700)" />
              <CardTitle>Schedule & Procedure Info</CardTitle>
            </div>
            <StatusBadge status={appointment.status} size="sm" />
          </CardHeader>

          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Date & Scheduled Time
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-primary-800)', marginTop: '2px' }}>
                  {appointment.date} • {appointment.time}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Duration: {appointment.durationMinutes} minutes
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Procedure / Service
                </span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {appointment.service}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Attending Doctor
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--c-primary-700)" />
                  {appointment.doctorName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Booking Coordinator
                </span>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {appointment.createdBy}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', backgroundColor: 'var(--c-slate-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-slate-600)', textTransform: 'uppercase' }}>
                Clinical Instructions & Booking Notes
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-line' }}>
                {appointment.notes || 'No special clinical notes recorded.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Contact Card */}
        <Card padding="md">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--c-primary-700)" />
              <CardTitle>Patient Contact Information</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Full Name
                </span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {appointment.patientName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Phone Number (WhatsApp)
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="var(--c-primary-700)" />
                  {appointment.patientPhone}
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/conversations')}
                  leftIcon={<Phone size={13} />}
                >
                  WhatsApp Thread
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/patients')}
                  leftIcon={<User size={13} />}
                >
                  Medical Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        description={`Select a new date and time slot for ${appointment.patientName} (${appointment.doctorName})`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingReschedule}
              disabled={
                isSavingReschedule ||
                isLoadingRescheduleSlots ||
                rescheduleSlots.isDoctorOnLeave ||
                rescheduleSlots.isDoctorOffDuty ||
                rescheduleSlots.availableSlots.length === 0 ||
                !newTime
              }
              onClick={handleReschedule}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Same-day / Next-day Shift Rules Banner */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: isSameDayAllowed ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${isSameDayAllowed ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: '8px',
              color: isSameDayAllowed ? '#166534' : '#475569',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            {isSameDayAllowed ? (
              <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} color="#64748b" style={{ marginTop: '2px', flexShrink: 0 }} />
            )}
            <span>{sameDayNotice}</span>
          </div>

          {/* Doctor Status Alert in Reschedule */}
          {rescheduleSlots.isDoctorOnLeave && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CalendarOff size={16} color="#dc2626" />
              <span>
                <strong>Doctor is on Leave:</strong> {rescheduleSlots.leaveReason || 'Unavailable on this date.'}
              </span>
            </div>
          )}

          {rescheduleSlots.isDoctorOffDuty && !rescheduleSlots.isDoctorOnLeave && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                color: '#b45309',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} color="#d97706" />
              <span>
                <strong>Doctor Off-Duty:</strong> {rescheduleSlots.offDutyReason || 'Not scheduled on this day.'}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="New Appointment Date"
              type="date"
              min={minRescheduleDate || new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <Select
              label="Available Time Slot"
              options={
                isLoadingRescheduleSlots
                  ? [{ value: '', label: 'Checking open slots...' }]
                  : rescheduleSlots.availableSlots.length > 0
                  ? rescheduleSlots.availableSlots.map((slot) => ({ value: slot, label: slot }))
                  : [
                      {
                        value: '',
                        label: rescheduleSlots.isDoctorOnLeave
                          ? 'Doctor on Leave'
                          : rescheduleSlots.isDoctorOffDuty
                          ? 'Doctor Off-Duty'
                          : newDate === new Date().toISOString().split('T')[0]
                          ? 'No remaining slots today'
                          : 'No Open Slots',
                      },
                    ]
              }
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              disabled={isLoadingRescheduleSlots || rescheduleSlots.availableSlots.length === 0}
            />
          </div>

          {rescheduleSlots.bookedSlots && rescheduleSlots.bookedSlots.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--c-slate-500)', marginTop: '-4px' }}>
              ℹ️ {rescheduleSlots.bookedSlots.length} spot(s) already booked ({rescheduleSlots.bookedSlots.join(', ')}).
            </div>
          )}

          <Input
            label="Reason for Rescheduling"
            placeholder="e.g. Patient requested afternoon time slot"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />
        </div>
      </Modal>

      <CreateInvoiceModal
        isOpen={isCompleteInvoiceOpen}
        onClose={() => setIsCompleteInvoiceOpen(false)}
        presetPatientId={appointment.patientId}
        presetService={appointment.service}
        appointmentId={appointment.id}
        treatingDoctorId={appointment.doctorId}
        autoSendWhatsApp
        title="Generate invoice to complete"
        description="Create the treatment invoice first. After you submit it, the invoice is sent on WhatsApp and this appointment is marked complete."
        submitLabel="Create invoice & complete"
        onCreated={handleCompleteInvoiceCreated}
      />

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this booking and free up the clinical slot?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" size="sm" onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
            Cancellation Reason
          </label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Patient called to postpone indefinitely due to travel..."
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
