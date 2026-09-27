/* Clinic settings: profile, catalog, roster, AI receptionist, WhatsApp status.
 * Services are consultation or procedure; procedures assign one or many doctors. */
import React, { useEffect, useState } from 'react';
import {
  Building2,
  Stethoscope,
  Users,
  Bot,
  MessageCircle,
  Save,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CalendarOff,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Tabs,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  MultiSelect,
  Badge,
  Modal,
  Skeleton,
  useToast,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ClinicServiceApi } from '../../services/clinic.service';
import {
  AIReceptionistConfig,
  ClinicProfile,
  ClinicService,
  Doctor,
  DoctorLeave,
  WhatsAppConfig,
} from '../../types';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const { user, can } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const canEdit = can('settings.edit');

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Clinic Settings Data
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [aiConfig, setAiConfig] = useState<AIReceptionistConfig | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);

  // Service add / edit / delete
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [deletingService, setDeletingService] = useState<ClinicService | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('45');
  const [newServiceCategory, setNewServiceCategory] = useState('General');
  const [newServiceType, setNewServiceType] = useState<'consultation' | 'procedure'>('procedure');
  const [newServiceDoctorIds, setNewServiceDoctorIds] = useState<string[]>([]);
  const [newServicePrice, setNewServicePrice] = useState('0');
  const [newServiceActive, setNewServiceActive] = useState(true);

  // Edit Schedule Modal State (Doctor only)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<Array<{ id: string; start: string; end: string }>>([
    { id: '1', start: '10:00 AM', end: '02:00 PM' },
    { id: '2', start: '05:00 PM', end: '08:00 PM' },
  ]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Declare Leave Modal State (Doctor only)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveDoctorId, setLeaveDoctorId] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState('');
  const [leaveToDate, setLeaveToDate] = useState('');
  const [leaveIsFullDay, setLeaveIsFullDay] = useState(true);
  const [leaveStartTime, setLeaveStartTime] = useState('09:00 AM');
  const [leaveEndTime, setLeaveEndTime] = useState('06:00 PM');
  const [leaveReason, setLeaveReason] = useState('Personal Time Off');
  const [isSavingLeave, setIsSavingLeave] = useState(false);



  const ALL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_OPTIONS = [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const [prof, lvs] = await Promise.all([
          ClinicServiceApi.getClinicProfile(),
          ClinicServiceApi.getDoctorLeaves().catch(() => []),
        ]);
        setProfile(prof);
        setServices(ClinicServiceApi.mapServicesFromProfile(prof));
        setDoctors(ClinicServiceApi.mapDoctorsFromProfile(prof));
        setLeaves(lvs);
        setAiConfig(ClinicServiceApi.mapAiFromProfile(prof));
        setWhatsappConfig(ClinicServiceApi.mapWhatsAppFromProfile(prof));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !profile) return;
    setIsSaving(true);
    try {
      await ClinicServiceApi.updateClinicProfile(profile);
      toast.success('Clinic Profile Saved', 'Updated operating hours and contact details.');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !aiConfig) return;
    setIsSaving(true);
    try {
      await ClinicServiceApi.updateAIConfig(aiConfig);
      toast.success('AI Receptionist Settings Saved', 'Virtual concierge behavior updated.');
    } catch (err) {
      toast.error('Failed to save AI configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const parseSlotsFromString = (hoursStr?: string | null): Array<{ id: string; start: string; end: string }> => {
    if (!hoursStr) return [{ id: '1', start: '10:00 AM', end: '02:00 PM' }, { id: '2', start: '05:00 PM', end: '08:00 PM' }];
    const ranges = hoursStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (ranges.length === 0) return [{ id: '1', start: '10:00 AM', end: '02:00 PM' }];

    return ranges.map((r, idx) => {
      const parts = r.split('-').map((s) => s.trim());
      return {
        id: String(idx + 1),
        start: parts[0] || '10:00 AM',
        end: parts[1] || '02:00 PM',
      };
    });
  };

  const handleOpenScheduleModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setSelectedDays(doc.availability?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    const hoursStr = doc.availability?.hours || '10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM';
    setScheduleSlots(parseSlotsFromString(hoursStr));
    setIsScheduleModalOpen(true);
  };

  const handleAddSlot = () => {
    const nextStart = scheduleSlots.length > 0 ? '05:00 PM' : '09:00 AM';
    const nextEnd = scheduleSlots.length > 0 ? '08:00 PM' : '01:00 PM';
    setScheduleSlots((prev) => [
      ...prev,
      { id: String(Date.now()), start: nextStart, end: nextEnd },
    ]);
  };

  const handleUpdateSlot = (id: string, field: 'start' | 'end', value: string) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveSlot = (id: string) => {
    if (scheduleSlots.length <= 1) {
      toast.error('At least one consultation slot is required');
      return;
    }
    setScheduleSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveDoctorSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (selectedDays.length === 0) {
      toast.error('Please select at least one working day');
      return;
    }
    if (scheduleSlots.length === 0) {
      toast.error('Please add at least one consultation slot');
      return;
    }
    setIsSavingSchedule(true);
    try {
      const availabilityHours = scheduleSlots.map((s) => `${s.start} - ${s.end}`).join(', ');
      await ClinicServiceApi.updateDoctorSchedule(editingDoctor.id, {
        availabilityDays: selectedDays,
        availabilityHours,
      });

      setDoctors((prev) =>
        prev.map((d) =>
          d.id === editingDoctor.id
            ? {
                ...d,
                availability: {
                  days: selectedDays,
                  hours: availabilityHours,
                },
              }
            : d
        )
      );

      toast.success('Schedule Updated', `Working days & slot timings saved for ${editingDoctor.name}.`);
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update doctor schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };


  const handleOpenLeaveModal = (docId?: string) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setLeaveDoctorId(docId || (doctors[0]?.id || ''));
    setLeaveFromDate(tomorrow);
    setLeaveToDate(tomorrow);
    setLeaveIsFullDay(true);
    setLeaveStartTime('09:00 AM');
    setLeaveEndTime('06:00 PM');
    setLeaveReason('Personal Time Off');
    setIsLeaveModalOpen(true);
  };

  const handleDeclareLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFromDate) {
      toast.error('Please select a leave starting date');
      return;
    }
    const finalToDate = leaveToDate || leaveFromDate;
    if (finalToDate < leaveFromDate) {
      toast.error("'Leave To Date' cannot be earlier than 'Leave From Date'");
      return;
    }

    setIsSavingLeave(true);
    try {
      await ClinicServiceApi.declareDoctorLeave({
        doctorId: leaveDoctorId || undefined,
        fromDate: leaveFromDate,
        toDate: finalToDate,
        startTime: leaveIsFullDay ? '00:00' : leaveStartTime,
        endTime: leaveIsFullDay ? '23:59' : leaveEndTime,
        reason: leaveReason || 'Personal Time Off',
      });

      // Refresh leaves from server
      const updatedLeaves = await ClinicServiceApi.getDoctorLeaves();
      setLeaves(updatedLeaves);

      const label = leaveFromDate === finalToDate ? leaveFromDate : `${leaveFromDate} to ${finalToDate}`;
      toast.success('Leave Declared', `Leave scheduled for ${label}. Booking slots are now blocked.`);
      setIsLeaveModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to declare leave');
    } finally {
      setIsSavingLeave(false);
    }
  };


  const handleDeleteLeave = async (leaveId: string) => {
    try {
      await ClinicServiceApi.deleteDoctorLeave(leaveId);
      setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
      toast.success('Leave Cancelled', 'Doctor availability restored for this date.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel leave');
    }
  };


  const resetServiceForm = () => {
    setEditingService(null);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceDuration('45');
    setNewServiceCategory('General');
    setNewServiceType('procedure');
    setNewServiceDoctorIds(doctors.map((d) => d.id));
    setNewServicePrice('0');
    setNewServiceActive(true);
  };

  const openAddService = () => {
    resetServiceForm();
    setIsServiceModalOpen(true);
  };

  const openEditService = (srv: ClinicService) => {
    const type = srv.serviceType === 'consultation' || srv.category === 'Consultation' ? 'consultation' : 'procedure';
    setEditingService(srv);
    setNewServiceName(srv.name);
    setNewServiceDesc(srv.description || '');
    setNewServiceDuration(String(srv.durationMinutes || 45));
    setNewServiceType(type);
    setNewServiceCategory(type === 'consultation' ? 'Consultation' : srv.category || 'General');
    setNewServiceDoctorIds(
      srv.doctorIds?.length ? srv.doctorIds : srv.doctorId ? [srv.doctorId] : doctors.map((d) => d.id)
    );
    setNewServicePrice(String(srv.price ?? 0));
    setNewServiceActive(srv.isActive !== false);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newServiceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (newServiceType === 'procedure' && !newServiceDoctorIds.length) {
      toast.error('Assign at least one doctor for this procedure');
      return;
    }
    setIsSavingService(true);
    try {
      const payload = {
        name: newServiceName.trim(),
        description: newServiceDesc,
        durationMinutes: parseInt(newServiceDuration, 10) || 45,
        category: newServiceType === 'consultation' ? 'Consultation' : newServiceCategory,
        serviceType: newServiceType,
        doctorIds: newServiceType === 'procedure' ? newServiceDoctorIds : [],
        doctorId: newServiceType === 'procedure' ? newServiceDoctorIds[0] || undefined : undefined,
        price: Number(newServicePrice) || 0,
        isActive: newServiceActive,
      };
      if (editingService) {
        const updated = await ClinicServiceApi.updateService(editingService.id, payload);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
        toast.success('Service Updated', `${updated.name} has been saved.`);
      } else {
        const created = await ClinicServiceApi.addService(payload);
        setServices((prev) => [...prev, created]);
        toast.success('Service Added', `${created.name} is now available in booking menu.`);
      }
      setIsServiceModalOpen(false);
      resetServiceForm();
    } catch (err) {
      toast.error(editingService ? 'Failed to update service' : 'Failed to add service');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    setIsDeletingService(true);
    try {
      const result = await ClinicServiceApi.deleteService(deletingService.id);
      if (result?.deactivated) {
        setServices((prev) =>
          prev.map((s) => (s.id === deletingService.id ? { ...s, isActive: false } : s))
        );
        toast.success(
          'Service Disabled',
          `${deletingService.name} is linked to past appointments, so it was deactivated instead of removed.`
        );
      } else {
        setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
        toast.success('Service Deleted', `${deletingService.name} was removed from the catalog.`);
      }
      setDeletingService(null);
    } catch (err) {
      toast.error('Failed to delete service');
    } finally {
      setIsDeletingService(false);
    }
  };

  if (isLoading || !profile || !aiConfig || !whatsappConfig) {
    return (
      <div>
        <Skeleton width="30%" height={32} style={{ marginBottom: '16px' }} />
        <Skeleton height={340} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Clinic Settings & Integrations"
        description={
          canEdit
            ? 'Configure your clinic details, medical services, doctor availability, AI concierge, and WhatsApp connection.'
            : 'View clinic details, services, doctors, AI concierge, and WhatsApp connection. Only a doctor can change these settings.'
        }
      />

      {!canEdit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--c-slate-100)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--c-slate-700)',
          }}
        >
          <Info size={16} color="var(--c-primary-700)" />
          <span>View only — staff can see settings but cannot edit them.</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <Tabs
        tabs={[
          { key: 'profile', label: 'Clinic Profile', icon: <Building2 size={15} /> },
          { key: 'services', label: 'Clinical Services', icon: <Stethoscope size={15} /> },
          { key: 'doctors', label: 'Doctors & Specialists', icon: <Users size={15} /> },
          { key: 'ai', label: 'AI Receptionist', icon: <Bot size={15} /> },
          { key: 'whatsapp', label: 'WhatsApp Connection', icon: <MessageCircle size={15} /> },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Clinic Profile */}
      {activeTab === 'profile' && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardTitle>Clinic Profile & Operating Details</CardTitle>
              <CardDescription>Primary clinic contact information displayed to patients on WhatsApp and appointments.</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={canEdit ? handleSaveProfile : (e) => e.preventDefault()}>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Input
                  label="Clinic Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  leftIcon={<Building2 size={16} />}
                  required
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />

                <Input
                  label="Public Phone Number"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  leftIcon={<Phone size={16} />}
                  required
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />

                <Input
                  label="Care Email Address"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  leftIcon={<Mail size={16} />}
                  required
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />

                <Input
                  label="City & State"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  required
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />
              </div>

              <Input
                label="Clinic Street Address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                leftIcon={<MapPin size={16} />}
                required
                disabled={!canEdit}
                readOnly={!canEdit}
              />

              <Input
                label="Working Hours & Days"
                value={profile.workingHours}
                onChange={(e) => setProfile({ ...profile, workingHours: e.target.value })}
                leftIcon={<Clock size={16} />}
                required
                disabled={!canEdit}
                readOnly={!canEdit}
              />
            </CardContent>

            {canEdit && (
              <CardFooter>
                <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={<Save size={15} />}>
                  Save Profile Changes
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      )}

      {/* Tab 2: Clinical Services */}
      {activeTab === 'services' && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardTitle>Clinical Services Catalog</CardTitle>
              <CardDescription>Procedures and treatments offered by your clinic with estimated durations.</CardDescription>
            </div>
            {isDoctor && (
              <Button
                variant="primary"
                size="sm"
                onClick={openAddService}
                leftIcon={<Plus size={14} />}
              >
                Add Service
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {!isDoctor && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--c-slate-100)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--c-slate-700)',
                }}
              >
                <Info size={16} color="var(--c-primary-700)" />
                <span>Staff account view: only doctors can add, edit, or delete clinical services.</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {services.map((srv) => (
                <div
                  key={srv.id}
                  style={{
                    backgroundColor: 'var(--c-slate-50)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {srv.name}
                      </h4>
                      <Badge variant="default" size="sm">
                        {srv.durationMinutes} mins
                      </Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {srv.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--c-slate-500)' }}>
                      {srv.serviceType === 'consultation' || srv.category === 'Consultation'
                        ? 'Consultation · all doctors'
                        : `Procedure${
                            srv.doctorNames?.length
                              ? ` · ${srv.doctorNames.join(', ')}`
                              : srv.doctorName
                                ? ` · ${srv.doctorName}`
                                : ''
                          }`}
                      {srv.category && srv.category !== 'Consultation' ? ` · ${srv.category}` : ''}
                      {srv.price != null ? ` · ₹${srv.price}` : ''}
                    </span>
                    <Badge variant={srv.isActive ? 'success' : 'neutral'} size="sm">
                      {srv.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  {isDoctor && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button variant="outline" size="sm" onClick={() => openEditService(srv)} leftIcon={<Edit2 size={13} />}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingService(srv)} leftIcon={<Trash2 size={13} />}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Doctors Roster */}
      {activeTab === 'doctors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card padding="lg">
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <CardTitle>Doctor & Specialist Roster</CardTitle>
                <CardDescription>
                  Doctors can customize their active working days, operating shift hours, and log upcoming leaves.
                </CardDescription>
              </div>
              {isDoctor && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenLeaveModal()}
                  leftIcon={<CalendarOff size={15} />}
                >
                  Declare Leave / Day-Off
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {!isDoctor && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--c-slate-100)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: 'var(--c-slate-700)',
                  }}
                >
                  <Info size={16} color="var(--c-primary-700)" />
                  <span>
                    Staff account view: Doctor working days and leave schedules can only be updated by the doctor.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      backgroundColor: 'var(--c-slate-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--c-primary-100)',
                          color: 'var(--c-primary-900)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {doc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {doc.name}
                          </span>
                          <Badge variant="success" size="sm">
                            Active Specialist
                          </Badge>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--c-primary-800)', fontWeight: 500, marginTop: '2px' }}>
                          {doc.specialization}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <strong>Schedule:</strong> {doc.availability.days.join(', ')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Clock size={12} />
                          {doc.availability.hours.split(',').map((slotStr, sIdx) => (
                            <Badge key={sIdx} variant="neutral" size="sm">
                              {slotStr.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {isDoctor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenScheduleModal(doc)}
                          leftIcon={<Edit2 size={13} />}
                        >
                          Edit Days & Slots
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leaves & Time-Off Section */}
          <Card padding="lg">
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarOff size={18} color="var(--c-primary-700)" />
                  Scheduled Leaves & Time-Off
                </CardTitle>
                <CardDescription>
                  Dates declared as leave will automatically block slot booking in AI receptionist & appointment scheduler.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {leaves.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: 'var(--c-slate-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-light)',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  <Calendar size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div>No upcoming leaves or off-days scheduled.</div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    Doctors are available according to standard weekly working days.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaves.map((leave) => (
                    <div
                      key={leave.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          📅 {(() => {
                            const formatLeave = (iso?: string) => {
                              if (!iso) return '';
                              const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
                              if (Number.isNaN(d.getTime())) return iso;
                              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            };
                            if (leave.startDate && leave.endDate && leave.startDate !== leave.endDate) {
                              return `${formatLeave(leave.startDate)} – ${formatLeave(leave.endDate)}`;
                            }
                            return formatLeave(leave.startDate || leave.date);
                          })()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {leave.doctorName || 'Doctor'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={12} />
                            <span>
                              {leave.startTime === '00:00' && leave.endTime === '23:59'
                                ? 'Full Day Leave'
                                : `${leave.startTime} - ${leave.endTime}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Badge variant="warning" size="sm">
                          {leave.reason || 'Personal Time Off'}
                        </Badge>

                        {isDoctor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLeave(leave.id)}
                            style={{ color: '#dc2626' }}
                            title="Cancel this leave"
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Tab 4: AI Receptionist Configuration UI */}
      {activeTab === 'ai' && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardTitle>AI Receptionist Settings</CardTitle>
              <CardDescription>
                These settings match clinic onboarding AI config and are used in WhatsApp AI prompting.
              </CardDescription>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: aiConfig.isEnabled ? 'var(--status-success)' : 'var(--text-muted)' }}>
                {aiConfig.isEnabled ? 'AI Receptionist Active' : 'AI Receptionist Paused'}
              </span>
              <button
                type="button"
                onClick={() => canEdit && setAiConfig({ ...aiConfig, isEnabled: !aiConfig.isEnabled })}
                disabled={!canEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: aiConfig.isEnabled ? 'var(--status-success)' : 'var(--c-slate-400)',
                  cursor: canEdit ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {aiConfig.isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </CardHeader>

          <form onSubmit={canEdit ? handleSaveAiConfig : (e) => e.preventDefault()}>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Input
                  label="AI Receptionist Name"
                  value={aiConfig.receptionistName}
                  onChange={(e) => setAiConfig({ ...aiConfig, receptionistName: e.target.value })}
                  leftIcon={<Bot size={16} />}
                  required
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />

                <Select
                  label="AI Personality / Tone"
                  options={[
                    { value: 'professional', label: 'Professional' },
                    { value: 'warm', label: 'Warm' },
                    { value: 'concise', label: 'Concise' },
                  ]}
                  value={aiConfig.tone}
                  onChange={(e) => setAiConfig({ ...aiConfig, tone: e.target.value as any })}
                  disabled={!canEdit}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
                  Greeting Message
                </label>
                <textarea
                  rows={2}
                  value={aiConfig.greetingMessage}
                  onChange={(e) => setAiConfig({ ...aiConfig, greetingMessage: e.target.value })}
                  readOnly={!canEdit}
                  disabled={!canEdit}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
                  Conversation Instructions
                </label>
                <textarea
                  rows={3}
                  value={aiConfig.conversationInstructions}
                  onChange={(e) => setAiConfig({ ...aiConfig, conversationInstructions: e.target.value })}
                  placeholder="Be helpful, concise, and guide patients toward booking."
                  readOnly={!canEdit}
                  disabled={!canEdit}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                Clinic Knowledge
              </div>
              {(
                [
                  ['clinicInformation', 'Clinic Information'],
                  ['servicesTreatments', 'Services & Treatments'],
                  ['doctorsInfo', 'Doctors'],
                  ['consultationDetails', 'Consultation Details'],
                  ['timings', 'Timings'],
                  ['faqs', 'FAQs'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>{label}</label>
                  <textarea
                    rows={key === 'faqs' ? 3 : 2}
                    value={aiConfig[key]}
                    onChange={(e) => setAiConfig({ ...aiConfig, [key]: e.target.value })}
                    readOnly={!canEdit}
                    disabled={!canEdit}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}
            </CardContent>

            {canEdit && (
              <CardFooter>
                <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={<Save size={15} />}>
                  Save AI Configuration
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      )}

      {/* Tab 5: WhatsApp Connection Status UI */}
      {activeTab === 'whatsapp' && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardTitle>WhatsApp Business Cloud Integration</CardTitle>
              <CardDescription>Meta WhatsApp Cloud API connection status and webhook pipeline monitor.</CardDescription>
            </div>
            <Badge variant="success" size="md">
              <CheckCircle2 size={13} />
              {whatsappConfig.status}
            </Badge>
          </CardHeader>

          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Registered WhatsApp Number
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-primary-800)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {whatsappConfig.phoneNumber}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Verified Business Name
                </span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {whatsappConfig.businessName}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Meta Quality Rating
                </span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--status-success)', marginTop: '2px' }}>
                  {whatsappConfig.qualityRating} Tier
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-success)' }}>
                  Cloud Webhook & Two-Way Sync Active
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  Incoming patient messages on WhatsApp will seamlessly appear in the Live Conversations Inbox in real time.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          resetServiceForm();
        }}
        title={editingService ? 'Edit Clinical Service' : 'Add Clinical Service'}
        description={
          editingService
            ? 'Consultation stays a visit type. Only assigned doable work becomes a doctor procedure.'
            : 'Pick consultation or a procedure. Procedures must be assigned to a doctor.'
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsServiceModalOpen(false);
                resetServiceForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveService} isLoading={isSavingService}>
              {editingService ? 'Save Changes' : 'Save Service'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Service Name"
            placeholder={newServiceType === 'consultation' ? 'e.g. General Consultation' : 'e.g. Laser Gum Depigmentation'}
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            required
          />

          <Select
            label="Service Type"
            options={[
              { value: 'consultation', label: 'Consultation — visit, not a procedure' },
              { value: 'procedure', label: 'Procedure — doable clinical work' },
            ]}
            value={newServiceType}
            onChange={(e) => {
              const next = e.target.value as 'consultation' | 'procedure';
              setNewServiceType(next);
              if (next === 'consultation') {
                setNewServiceCategory('Consultation');
                setNewServiceDoctorIds([]);
              } else {
                setNewServiceCategory((prev) => (prev === 'Consultation' ? 'General' : prev));
                setNewServiceDoctorIds((prev) => (prev.length ? prev : doctors.map((d) => d.id)));
              }
            }}
          />

          {newServiceType === 'procedure' && (
            <MultiSelect
              label="Assigned Doctors"
              helperText="Select every doctor who performs this. Choose All doctors if it is shared."
              options={doctors.map((d) => ({ value: d.id, label: d.name }))}
              value={newServiceDoctorIds}
              onChange={setNewServiceDoctorIds}
              placeholder="Select doctors"
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Select
              label="Estimated Duration"
              options={[
                { value: '30', label: '30 mins' },
                { value: '45', label: '45 mins' },
                { value: '60', label: '60 mins' },
                { value: '90', label: '90 mins' },
                ...(!['30', '45', '60', '90'].includes(newServiceDuration)
                  ? [{ value: newServiceDuration, label: `${newServiceDuration} mins` }]
                  : []),
              ]}
              value={newServiceDuration}
              onChange={(e) => setNewServiceDuration(e.target.value)}
            />

            {newServiceType === 'procedure' && (
              <Select
                label="Category"
                options={[
                  { value: 'General', label: 'General' },
                  { value: 'Implantology', label: 'Implantology' },
                  { value: 'Orthodontics', label: 'Orthodontics' },
                  { value: 'Cosmetic', label: 'Cosmetic' },
                  { value: 'Endodontics', label: 'Endodontics' },
                  { value: 'Oral Surgery', label: 'Oral Surgery' },
                ]}
                value={newServiceCategory === 'Consultation' ? 'General' : newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
              />
            )}

            <Input
              label="Price (₹)"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
              Service Description
            </label>
            <textarea
              rows={3}
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Clinical scope, technology used, pre-procedure guidance..."
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

          {editingService && (
            <button
              type="button"
              onClick={() => setNewServiceActive((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--c-slate-700)',
              }}
            >
              {newServiceActive ? <ToggleRight size={20} color="var(--c-primary-700)" /> : <ToggleLeft size={20} />}
              {newServiceActive ? 'Active — offered in booking' : 'Disabled — hidden from booking'}
            </button>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        title="Delete Service"
        description="This removes the service from the clinic catalog. Existing appointments are not cancelled."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeletingService(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDeleteService} isLoading={isDeletingService} leftIcon={<Trash2 size={14} />}>
              Delete Service
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Remove <strong>{deletingService?.name}</strong> from Clinical Services?
        </p>
      </Modal>

      {/* Edit Schedule Modal (Doctor Only) */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Edit Schedule & Slots - ${editingDoctor?.name || 'Doctor'}`}
        description="Select active consultation days and configure daily shift time slots (e.g. morning & evening)."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveDoctorSchedule} isLoading={isSavingSchedule}>
              Save Schedule
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveDoctorSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-slate-800)', display: 'block', marginBottom: '8px' }}>
              Working Days of Week (Click to toggle)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ALL_WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      backgroundColor: isSelected ? 'var(--c-primary-50)' : '#f8fafc',
                      color: isSelected ? 'var(--c-primary-900)' : 'var(--c-slate-600)',
                      border: isSelected ? '2px solid var(--c-primary-600)' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <CheckCircle2 size={14} color="var(--c-primary-700)" />}
                    {day}
                  </button>
                );
              })}
            </div>
            {selectedDays.length === 0 && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                Please select at least one working day.
              </div>
            )}
          </div>

          {/* Multi-Slot Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-slate-800)' }}>
                Daily Consultation Slots ({scheduleSlots.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSlot}
                leftIcon={<Plus size={13} />}
              >
                Add Slot
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scheduleSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--c-primary-800)', minWidth: '50px' }}>
                    Slot {index + 1}:
                  </span>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Select
                      options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
                      value={slot.start}
                      onChange={(e) => handleUpdateSlot(slot.id, 'start', e.target.value)}
                    />
                    <Select
                      options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
                      value={slot.end}
                      onChange={(e) => handleUpdateSlot(slot.id, 'end', e.target.value)}
                    />
                  </div>
                  {scheduleSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                      }}
                      title="Remove Slot"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--c-slate-700)',
            }}
          >
            <strong>Active Shifts:</strong> Available {selectedDays.length} days/week ({selectedDays.join(', ') || 'None'}) during{' '}
            {scheduleSlots.map((s) => `${s.start} to ${s.end}`).join(' & ')}.
          </div>
        </form>
      </Modal>

      {/* Declare Leave / Time-Off Modal (Doctor Only) */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Declare Leave / Time-Off"
        description="Mark a date range as unavailable. AI Receptionist and online calendar will block all booking slots."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDeclareLeave} isLoading={isSavingLeave}>
              Confirm Leave
            </Button>
          </>
        }
      >
        <form onSubmit={handleDeclareLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {doctors.length > 1 && (
            <Select
              label="Doctor"
              options={doctors.map((d) => ({ value: d.id, label: d.name }))}
              value={leaveDoctorId}
              onChange={(e) => setLeaveDoctorId(e.target.value)}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Leave From Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={leaveFromDate}
              onChange={(e) => {
                setLeaveFromDate(e.target.value);
                if (!leaveToDate || leaveToDate < e.target.value) {
                  setLeaveToDate(e.target.value);
                }
              }}
              required
            />
            <Input
              label="Leave To Date"
              type="date"
              min={leaveFromDate || new Date().toISOString().split('T')[0]}
              value={leaveToDate}
              onChange={(e) => setLeaveToDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="fullDayToggle"
              checked={leaveIsFullDay}
              onChange={(e) => setLeaveIsFullDay(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="fullDayToggle" style={{ fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Full Day Leave (All slots blocked)
            </label>
          </div>

          {!leaveIsFullDay && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select
                label="From Time"
                options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
                value={leaveStartTime}
                onChange={(e) => setLeaveStartTime(e.target.value)}
              />
              <Select
                label="Until Time"
                options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
                value={leaveEndTime}
                onChange={(e) => setLeaveEndTime(e.target.value)}
              />
            </div>
          )}

          <Select
            label="Reason"
            options={[
              { value: 'Personal Time Off', label: 'Personal Time Off' },
              { value: 'Vacation', label: 'Vacation' },
              { value: 'Sick Leave', label: 'Sick Leave / Medical' },
              { value: 'Medical Conference', label: 'Medical Conference / Workshop' },
              { value: 'Emergency', label: 'Emergency' },
              { value: 'Clinic Closed', label: 'Clinic Maintenance / Closed' },
            ]}
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
