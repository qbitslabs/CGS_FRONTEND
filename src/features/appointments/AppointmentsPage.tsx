/* Staff calendar and list of clinic appointments with live doctor options.
 * Create, complete, reschedule, or cancel visits; complete opens invoice. */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  User,
  CalendarCheck,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarOff,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import {
  PageHeader,
  Button,
  ExportExcelButton,
  Select,
  Card,
  StatusBadge,
  Badge,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  Input,
  EmptyState,
  TableSkeleton,
  useToast,
  Tabs,
  TabItem,
} from '../../components/ui';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../services/patient.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { Appointment, AppointmentStatus, Doctor, Patient } from '../../types';
import { CreateInvoiceModal } from '../billing/CreateInvoiceModal';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const seesAll = userSeesAllClinicData(user);

  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [appointmentTab, setAppointmentTab] = useState<'active' | 'not_completed' | 'completed' | 'cancelled' | 'all'>('active');

  // Filters
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'All'>('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Metadata
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [servicesList, setServicesList] = useState<{ id: string; name: string }[]>([]);

  // New Appointment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [aptTime, setAptTime] = useState('10:00 AM');
  const [duration, setDuration] = useState('45');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [isCompleteInvoiceOpen, setIsCompleteInvoiceOpen] = useState(false);
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('Patient arrived / missed slot - Rescheduled');
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


  // Doctor Availability & Slot Engine State
  const [slotAvailability, setSlotAvailability] = useState<{
    isDoctorOnLeave?: boolean;
    isDoctorOffDuty?: boolean;
    leaveReason?: string;
    offDutyReason?: string;
    availableSlots: string[];
    bookedSlots: string[];
  }>({ availableSlots: [], bookedSlots: [] });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [docs, pats, services] = await Promise.all([
          ClinicServiceApi.getDoctors(),
          PatientService.getPatients({ pageSize: 100 }),
          ClinicServiceApi.getServices(),
        ]);
        setDoctorsList(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
          setDoctorName(docs[0].name);
        }
        setPatientsList(pats.data);
        const activeServices = (services || [])
          .filter((s) => s.isActive !== false)
          .map((s) => ({ id: s.id, name: s.name }));
        setServicesList(activeServices);
        if (activeServices.length > 0) {
          setServiceName(activeServices[0].name);
        }
      } catch (e) {
        console.warn('Failed to load doctors/patients/services', e);
      }
    };
    loadMetadata();
  }, []);

  // Fetch slots whenever doctor, date, or modal state changes
  useEffect(() => {
    if (!isModalOpen) return;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await AppointmentService.getDoctorAvailability(selectedDoctorId, aptDate);
        setSlotAvailability({
          isDoctorOnLeave: res.isDoctorOnLeave,
          isDoctorOffDuty: res.isDoctorOffDuty,
          leaveReason: res.leaveReason,
          offDutyReason: res.offDutyReason,
          availableSlots: res.availableSlots || [],
          bookedSlots: res.bookedSlots || [],
        });
        if (res.availableSlots && res.availableSlots.length > 0) {
          if (!res.availableSlots.includes(aptTime)) {
            setAptTime(res.availableSlots[0]);
          }
        } else {
          setAptTime('');
        }
      } catch (err) {
        console.error('Failed to get slots from API, evaluating local doctor schedule', err);
        const currentDoc = doctorsList.find((d) => d.id === selectedDoctorId);
        if (currentDoc) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const [year, month, day] = aptDate.split('-').map((s) => parseInt(s, 10));
          const dateObj = new Date(year, month - 1, day);
          const dayOfWeek = dayNames[dateObj.getDay()];
          const isOffDuty = currentDoc.availability?.days && currentDoc.availability.days.length > 0 && !currentDoc.availability.days.includes(dayOfWeek);

          if (isOffDuty) {
            setSlotAvailability({
              isDoctorOffDuty: true,
              offDutyReason: `Doctor does not consult on ${dayOfWeek}s`,
              availableSlots: [],
              bookedSlots: [],
            });
            setAptTime('');
          } else {
            // Generate slots from doctor's availability hours
            const hoursStr = currentDoc.availability?.hours || '09:00 AM - 05:00 PM';
            const ranges = hoursStr.split(',').map((s) => s.trim()).filter(Boolean);
            const genSlots: string[] = [];
            const parseToMin = (t: string) => {
              const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!m) return null;
              let h = parseInt(m[1], 10);
              const min = parseInt(m[2], 10);
              if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
              if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
              return h * 60 + min;
            };
            const toTimeStr = (min: number) => {
              let h = Math.floor(min / 60);
              const m = min % 60;
              const p = h >= 12 ? 'PM' : 'AM';
              if (h > 12) h -= 12;
              if (h === 0) h = 12;
              return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m} ${p}`;
            };
            for (const r of ranges) {
              const [s, e] = r.split('-').map((x) => x.trim());
              const sMin = parseToMin(s);
              const eMin = parseToMin(e);
              if (sMin !== null && eMin !== null) {
                for (let cur = sMin; cur < eMin; cur += 30) genSlots.push(toTimeStr(cur));
              }
            }
            setSlotAvailability({
              isDoctorOffDuty: false,
              isDoctorOnLeave: false,
              availableSlots: genSlots,
              bookedSlots: [],
            });
            if (genSlots.length > 0) setAptTime(genSlots[0]);
          }
        }
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [isModalOpen, selectedDoctorId, aptDate, doctorsList]);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await AppointmentService.getAppointments({
        doctorId: seesAll ? doctorFilter : user?.doctorId || doctorFilter,
        status: statusFilter,
        service: serviceFilter,
      });
      setAppointments(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [doctorFilter, statusFilter, serviceFilter, toast, seesAll, user?.doctorId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error('Patient name and phone are required');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPatientId = selectedPatientId;
      if (!finalPatientId) {
        const existing = patientsList.find((p) => p.phone === patientPhone.trim() || p.name.toLowerCase() === patientName.trim().toLowerCase());
        if (existing) {
          finalPatientId = existing.id;
        } else {
          const newPat = await PatientService.createPatient({
            name: patientName.trim(),
            phone: patientPhone.trim(),
            email: '',
            allergies: [],
            medicalHistoryNotes: notes || '',
            status: 'Active',
          });
          finalPatientId = newPat.id;
        }
      }

      const selectedDoc = doctorsList.find((d) => d.id === selectedDoctorId) || doctorsList[0];
      if (!selectedDoc?.id) {
        toast.error('Doctor Required', 'Select a doctor from the clinic roster before booking.');
        setIsSubmitting(false);
        return;
      }

      const newApt = await AppointmentService.createAppointment({
        patientId: finalPatientId,
        patientName,
        patientPhone,
        doctorId: selectedDoc.id,
        doctorName: selectedDoc.name,
        service: serviceName,
        date: aptDate,
        time: aptTime,
        durationMinutes: parseInt(duration, 10) || 45,
        status: 'Confirmed',
        notes: notes || 'Scheduled via Clinic Dashboard.',
        createdBy: 'Current User',
      });
      toast.success('Appointment Scheduled', `Confirmed for ${newApt.patientName} on ${newApt.date} at ${newApt.time}`);
      setIsModalOpen(false);
      // Reset
      setPatientName('');
      setPatientPhone('');
      setSelectedPatientId('');
      setNotes('');
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAppointmentOverdue = (apt: Appointment): boolean => {
    if (apt.status === 'Completed' || apt.status === 'Cancelled') return false;
    if (apt.status === 'No Show' || apt.status === 'Not Completed') return true;
    try {
      const cleanDate = apt.date.split('T')[0];
      const [year, month, day] = cleanDate.split('-').map((s) => parseInt(s, 10));
      let hours = 0;
      let mins = 0;
      if (apt.time) {
        const match = apt.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          hours = parseInt(match[1], 10);
          mins = parseInt(match[2], 10);
          if (match[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
      }
      const aptTimeMs = new Date(year, month - 1, day, hours, mins).getTime();
      return aptTimeMs < Date.now();
    } catch (e) {
      return false;
    }
  };

  const evaluateDoctorTodaySlots = (doc?: Doctor): { allowed: boolean; notice: string; latestEndTimeStr: string } => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayOfWeek = dayNames[new Date().getDay()];

    if (!doc) {
      return { allowed: true, notice: 'Same-day reschedule available.', latestEndTimeStr: '08:00 PM' };
    }

    // Check if doctor works today
    if (doc.availability?.days && doc.availability.days.length > 0 && !doc.availability.days.includes(todayDayOfWeek)) {
      return {
        allowed: false,
        notice: `Doctor does not consult on ${todayDayOfWeek}s. Rescheduling is available for upcoming working days.`,
        latestEndTimeStr: '',
      };
    }

    // Parse doctor's shift slots to find latest end time today
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

    // Compare current local time with latest shift end time
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
  };

  const handleOpenRescheduleModal = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    setReschedulingApt(apt);
    const assignedDoc = doctorsList.find((d) => d.id === apt.doctorId || d.name === apt.doctorName) || doctorsList[0];
    const docId = assignedDoc ? assignedDoc.id : apt.doctorId;
    setRescheduleDoctorId(docId);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const todayEval = evaluateDoctorTodaySlots(assignedDoc);
    setIsSameDayAllowed(todayEval.allowed);
    setSameDayNotice(todayEval.notice);

    if (todayEval.allowed) {
      setMinRescheduleDate(todayStr);
      setRescheduleDate(todayStr);
    } else {
      setMinRescheduleDate(tomorrowStr);
      setRescheduleDate(tomorrowStr);
    }

    setRescheduleTime('');
    setRescheduleReason('Patient arrived / missed slot - Rescheduled');
    setIsRescheduleModalOpen(true);
  };

  // Fetch slots whenever reschedule doctor or date changes
  useEffect(() => {
    if (!isRescheduleModalOpen || !rescheduleDoctorId || !rescheduleDate) return;
    const fetchRescheduleSlots = async () => {
      setIsLoadingRescheduleSlots(true);
      try {
        const res = await AppointmentService.getDoctorAvailability(rescheduleDoctorId, rescheduleDate);
        let slots = res.availableSlots || [];

        // If reschedule date is today, filter out past time slots
        const todayStr = new Date().toISOString().split('T')[0];
        if (rescheduleDate === todayStr) {
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
          setRescheduleTime(slots[0]);
        } else {
          setRescheduleTime('');
        }
      } catch (err) {
        console.error('Failed to get slots for reschedule', err);
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    };
    fetchRescheduleSlots();
  }, [isRescheduleModalOpen, rescheduleDoctorId, rescheduleDate]);

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt || !rescheduleDate || !rescheduleTime) {
      toast.error('Please select a valid reschedule date and time slot');
      return;
    }
    setIsSavingReschedule(true);
    try {
      await AppointmentService.reschedule(
        reschedulingApt.id,
        rescheduleDate,
        rescheduleTime,
        rescheduleReason,
        rescheduleDoctorId
      );
      toast.success(
        'Appointment Rescheduled',
        `${reschedulingApt.patientName}'s appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}.`
      );
      setIsRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to reschedule appointment');
    } finally {
      setIsSavingReschedule(false);
    }
  };

  const handleQuickComplete = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    setCompletingApt(apt);
    setIsCompleteInvoiceOpen(true);
  };

  const handleCompleteInvoiceCreated = async () => {
    if (!completingApt) return;
    try {
      await AppointmentService.updateStatus(completingApt.id, 'Completed');
      toast.success(
        'Appointment Completed',
        `${completingApt.patientName}'s appointment marked as completed.`
      );
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Invoice saved, but completing the appointment failed.');
    } finally {
      setCompletingApt(null);
    }
  };

  // Tab counts
  const overdueCount = appointments.filter((a) => isAppointmentOverdue(a)).length;
  const activeCount = appointments.filter(
    (a) => !isAppointmentOverdue(a) && (a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Rescheduled')
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'Cancelled' || a.status === 'No Show').length;

  const appointmentTabs: TabItem[] = [
    {
      key: 'active',
      label: 'Upcoming & Active',
      icon: <Clock size={15} />,
      badge: <Badge variant="default" size="sm">{activeCount}</Badge>,
    },
    {
      key: 'not_completed',
      label: 'Not Completed (Missed)',
      icon: <AlertTriangle size={15} color="#d97706" />,
      badge: overdueCount > 0 ? <Badge variant="warning" size="sm">{overdueCount}</Badge> : undefined,
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle2 size={15} color="var(--status-success)" />,
      badge: <Badge variant="success" size="sm">{completedCount}</Badge>,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: <XCircle size={15} />,
      badge: cancelledCount > 0 ? <Badge variant="error" size="sm">{cancelledCount}</Badge> : undefined,
    },
    {
      key: 'all',
      label: 'All Appointments',
      icon: <List size={15} />,
      badge: <Badge variant="neutral" size="sm">{appointments.length}</Badge>,
    },
  ];

  // Filter appointments according to selected tab
  const displayedAppointments = appointments.filter((a) => {
    if (appointmentTab === 'active') {
      return !isAppointmentOverdue(a) && (a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Rescheduled');
    }
    if (appointmentTab === 'not_completed') {
      return isAppointmentOverdue(a);
    }
    if (appointmentTab === 'completed') {
      return a.status === 'Completed';
    }
    if (appointmentTab === 'cancelled') {
      return a.status === 'Cancelled' || a.status === 'No Show';
    }
    return true;
  });

  // Group appointments by date for Calendar view
  const groupedByDate: Record<string, Appointment[]> = {};
  displayedAppointments.forEach((apt) => {
    if (!groupedByDate[apt.date]) {
      groupedByDate[apt.date] = [];
    }
    groupedByDate[apt.date].push(apt);
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Appointments & Scheduling"
        description="Manage doctor timetables, consultation slots, and patient booking statuses."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--c-slate-100)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: viewMode === 'calendar' ? '#ffffff' : 'transparent',
                  color: viewMode === 'calendar' ? 'var(--c-primary-800)' : 'var(--c-slate-600)',
                  boxShadow: viewMode === 'calendar' ? 'var(--shadow-xs)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <CalendarIcon size={14} />
                Calendar View
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? 'var(--c-primary-800)' : 'var(--c-slate-600)',
                  boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <List size={14} />
                List View
              </button>
            </div>

            <ExportExcelButton
              filename="appointments"
              headers={['Patient', 'Phone', 'Doctor', 'Service', 'Date', 'Time', 'Status']}
              rows={displayedAppointments.map((apt) => [
                apt.patientName,
                apt.patientPhone,
                apt.doctorName,
                apt.service,
                formatDate(apt.date),
                apt.time,
                apt.status,
              ])}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus size={16} />}
            >
              Book Appointment
            </Button>
          </div>
        }
      />

      {/* Tabs Header */}
      <Tabs
        tabs={appointmentTabs}
        activeKey={appointmentTab}
        onChange={(k) => setAppointmentTab(k as any)}
      />

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
            <Select
              options={
                seesAll
                  ? [{ value: 'All', label: 'All Doctors' }, ...doctorsList.map((d) => ({ value: d.id, label: d.name }))]
                  : doctorsList
                      .filter((d) => d.id === user?.doctorId)
                      .map((d) => ({ value: d.id, label: d.name || 'My appointments' }))
              }
              value={seesAll ? doctorFilter : user?.doctorId || doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              disabled={!seesAll}
            />
          </div>

          <div style={{ flex: '1 1 160px', minWidth: '130px' }}>
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
                { value: 'Rescheduled', label: 'Rescheduled' },
                { value: 'No Show', label: 'No Show' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            />
          </div>

          <div style={{ flex: '1 1 190px', minWidth: '150px' }}>
            <Select
              options={[
                { value: 'All', label: 'All Services' },
                ...servicesList.map((s) => ({ value: s.name, label: s.name })),
              ]}
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            />
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong>{displayedAppointments.length}</strong> {appointmentTab === 'completed' ? 'completed' : appointmentTab === 'active' ? 'active' : ''} appointments
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <TableContainer>
          <TableSkeleton rows={5} cols={5} />
        </TableContainer>
      ) : displayedAppointments.length === 0 ? (
        <EmptyState
          title={
            appointmentTab === 'completed'
              ? 'No completed appointments'
              : appointmentTab === 'cancelled'
              ? 'No cancelled appointments'
              : 'No appointments found'
          }
          description={
            appointmentTab === 'completed'
              ? 'Appointments marked as completed will appear in this tab.'
              : appointmentTab === 'active'
              ? 'No upcoming clinical consultations currently scheduled.'
              : 'No appointments match the selected doctor or service filter.'
          }
          actionLabel="Book New Appointment"
          actionIcon={<Plus size={14} />}
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'calendar' ? (
        /* Calendar Schedule Cards View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.keys(groupedByDate).map((dateKey) => {
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const dateLabel = isToday
              ? `Today (${formatDate(dateKey)})`
              : new Intl.DateTimeFormat('en-IN', {
                  timeZone: 'UTC',
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(`${dateKey}T00:00:00Z`));

            const dayApts = groupedByDate[dateKey];

            return (
              <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <CalendarCheck size={16} color="var(--c-primary-700)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dateLabel}
                  </h3>
                  {isToday && (
                    <Badge variant="default" size="sm">
                      Today
                    </Badge>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ({dayApts.length} bookings)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                    gap: '14px',
                  }}
                >
                  {dayApts.map((apt) => (
                    <Card
                      key={apt.id}
                      padding="md"
                      style={{
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        borderLeft: `4px solid ${
                          apt.status === 'Confirmed'
                            ? 'var(--status-success)'
                            : apt.status === 'Completed'
                            ? 'var(--c-slate-400)'
                            : 'var(--status-info)'
                        }`,
                      }}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {apt.time}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {apt.durationMinutes} mins consultation
                          </div>
                        </div>
                        <StatusBadge status={apt.status} size="sm" />
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {apt.patientName}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--c-primary-800)', fontWeight: 500, marginBottom: '6px' }}>
                        {apt.service}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} color="var(--c-slate-400)" />
                          {apt.doctorName}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleOpenRescheduleModal(e, apt)}
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                                leftIcon={<RotateCcw size={11} />}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => handleQuickComplete(e, apt)}
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                              >
                                Complete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View Data Table */
        <TableContainer>
          <Table>
            <Thead>
              <Tr isHoverable={false}>
                <Th>Patient Name</Th>
                <Th>Phone</Th>
                <Th>Doctor</Th>
                <Th>Service</Th>
                <Th>Date & Time</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedAppointments.map((apt) => (
                <Tr
                  key={apt.id}
                  isClickable
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                >
                  <Td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {apt.patientName}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--c-slate-700)', fontFamily: 'monospace' }}>
                      {apt.patientPhone}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {apt.doctorName}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--c-primary-800)' }}>
                      {apt.service}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDate(apt.date)} • {apt.time}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={apt.status} size="sm" />
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleOpenRescheduleModal(e, apt)}
                            style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                            leftIcon={<RotateCcw size={11} />}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleQuickComplete(e, apt)}
                            style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments/${apt.id}`);
                        }}
                        title="View Details"
                        style={{ padding: '6px' }}
                      >
                        <Eye size={15} />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* Reschedule Appointment Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        description={
          reschedulingApt
            ? `Rescheduling ${reschedulingApt.patientName}'s ${reschedulingApt.service} with ${reschedulingApt.doctorName}.`
            : 'Select a new clinical date and slot.'
        }
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
                !rescheduleTime
              }
              onClick={handleConfirmReschedule}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          {doctorsList.length > 1 && (
            <Select
              label="Assigned Doctor"
              options={doctorsList.map((d) => ({ value: d.id, label: `${d.name} (${d.specialization})` }))}
              value={rescheduleDoctorId}
              onChange={(e) => setRescheduleDoctorId(e.target.value)}
            />
          )}

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
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
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
                          : rescheduleDate === new Date().toISOString().split('T')[0]
                          ? 'No remaining slots today'
                          : 'No Open Slots',
                      },
                    ]
              }
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              disabled={isLoadingRescheduleSlots || rescheduleSlots.availableSlots.length === 0}
            />
          </div>

          {rescheduleSlots.bookedSlots && rescheduleSlots.bookedSlots.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--c-slate-500)', marginTop: '-4px' }}>
              ℹ️ {rescheduleSlots.bookedSlots.length} spot(s) already booked ({rescheduleSlots.bookedSlots.join(', ')}).
            </div>
          )}

          <Input
            label="Reason for Reschedule"
            placeholder="e.g. Patient arrived late / missed original morning slot"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />
        </form>
      </Modal>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Clinic Appointment"
        description="Book a dedicated clinical time slot for a patient."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={
                isSubmitting ||
                isLoadingSlots ||
                slotAvailability.isDoctorOnLeave ||
                slotAvailability.isDoctorOffDuty ||
                slotAvailability.availableSlots.length === 0 ||
                !aptTime
              }
              onClick={handleCreateAppointment}
            >
              Confirm Appointment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Patient Full Name"
            placeholder="Patient full name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />

          <Input
            label="Patient Phone Number"
            placeholder="+91 98440 12345"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Select
              label="Assigned Doctor"
              options={
                doctorsList.length > 0
                  ? doctorsList.map((d) => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
                  : [{ value: '', label: 'No doctors in clinic' }]
              }
              disabled={doctorsList.length === 0}
              value={selectedDoctorId || doctorName}
              onChange={(e) => {
                const doc = doctorsList.find((d) => d.id === e.target.value);
                if (doc) {
                  setSelectedDoctorId(doc.id);
                  setDoctorName(doc.name);
                } else {
                  setDoctorName(e.target.value);
                }
              }}
            />

            <Select
              label="Procedure / Service"
              options={
                servicesList.length > 0
                  ? servicesList.map((s) => ({ value: s.name, label: s.name }))
                  : [{ value: '', label: 'No services configured' }]
              }
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              disabled={servicesList.length === 0}
            />
          </div>

          {/* Doctor Status Banner (Leave or Off-Duty) */}
          {slotAvailability.isDoctorOnLeave && (
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
                <strong>Doctor is on Scheduled Leave:</strong> {slotAvailability.leaveReason || 'Unavailable on this date.'}
              </span>
            </div>
          )}

          {slotAvailability.isDoctorOffDuty && !slotAvailability.isDoctorOnLeave && (
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
                <strong>Doctor Off-Duty:</strong> {slotAvailability.offDutyReason || 'Not scheduled to consult on this weekday.'}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <Input
              label="Date"
              type="date"
              value={aptDate}
              onChange={(e) => setAptDate(e.target.value)}
              required
            />
            <Select
              label="Time Slot"
              options={
                isLoadingSlots
                  ? [{ value: '', label: 'Checking availability...' }]
                  : slotAvailability.availableSlots.length > 0
                  ? slotAvailability.availableSlots.map((slot) => ({ value: slot, label: slot }))
                  : [{ value: '', label: slotAvailability.isDoctorOnLeave ? 'Doctor on Leave' : slotAvailability.isDoctorOffDuty ? 'Doctor Off-Duty' : 'No Open Slots' }]
              }
              value={aptTime}
              onChange={(e) => setAptTime(e.target.value)}
              disabled={isLoadingSlots || slotAvailability.availableSlots.length === 0}
            />
            <Select
              label="Duration"
              options={[
                { value: '30', label: '30 mins' },
                { value: '45', label: '45 mins' },
                { value: '60', label: '60 mins' },
              ]}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Booked Spot Indicator */}
          {slotAvailability.bookedSlots && slotAvailability.bookedSlots.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--c-slate-500)', marginTop: '-4px' }}>
              ℹ️ {slotAvailability.bookedSlots.length} spot(s) already booked ({slotAvailability.bookedSlots.join(', ')}). Only available slots are listed.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
              Appointment Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical instructions, reason for visit..."
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
        </form>
      </Modal>

      <CreateInvoiceModal
        isOpen={isCompleteInvoiceOpen}
        onClose={() => {
          setIsCompleteInvoiceOpen(false);
          setCompletingApt(null);
        }}
        presetPatientId={completingApt?.patientId}
        presetService={completingApt?.service}
        appointmentId={completingApt?.id}
        treatingDoctorId={completingApt?.doctorId}
        autoSendWhatsApp
        title="Generate invoice to complete"
        description="Create the treatment invoice. Choose the treating doctor, and choose whether to send the bill on WhatsApp."
        submitLabel="Create invoice & complete"
        onCreated={handleCompleteInvoiceCreated}
      />
    </div>
  );
};
