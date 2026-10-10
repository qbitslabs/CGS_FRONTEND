/* One lead's profile, conversion actions, and activity timeline.
 * Doctor dropdowns come from the live clinic roster only. */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  UserCheck,
  Clock,
  FileText,
  CalendarOff,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/format';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  Badge,
  Timeline,
  Modal,
  Select,
  Input,
  Skeleton,
  ErrorState,
  useToast,
} from '../../components/ui';
import { LeadService } from '../../services/lead.service';
import { ConversationService } from '../../services/conversation.service';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../services/patient.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { Appointment, Conversation, Doctor, Lead, LeadStatus, Message } from '../../types';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Change Modal / Note Modal / Book Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('11:00 AM');
  const [bookDoctor, setBookDoctor] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
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
    const loadDoctors = async () => {
      try {
        const docs = await ClinicServiceApi.getDoctors();
        setDoctorsList(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
          setBookDoctor(docs[0].name);
        }
      } catch (err) {
        console.warn('Failed to load doctors', err);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    if (!isBookModalOpen) return;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await AppointmentService.getDoctorAvailability(selectedDoctorId, bookDate);
        setSlotAvailability({
          isDoctorOnLeave: res.isDoctorOnLeave,
          isDoctorOffDuty: res.isDoctorOffDuty,
          leaveReason: res.leaveReason,
          offDutyReason: res.offDutyReason,
          availableSlots: res.availableSlots || [],
          bookedSlots: res.bookedSlots || [],
        });
        if (res.availableSlots && res.availableSlots.length > 0) {
          if (!res.availableSlots.includes(bookTime)) {
            setBookTime(res.availableSlots[0]);
          }
        } else {
          setBookTime('');
        }
      } catch (err) {
        console.warn('Failed to get slots for lead booking', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [isBookModalOpen, selectedDoctorId, bookDate]);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const leadData = await LeadService.getLeadById(id);
        setLead(leadData);

        // Fetch linked conversation if exists
        if (leadData.linkedConversationId) {
          try {
            const conv = await ConversationService.getConversationById(leadData.linkedConversationId);
            setConversation(conv);
            const msgs = await ConversationService.getMessages(leadData.linkedConversationId);
            setMessages(msgs);
          } catch (e) {
            console.warn('No conversation found for lead', e);
          }
        }

        // Fetch linked appointment if exists
        if (leadData.linkedAppointmentId) {
          try {
            const apt = await AppointmentService.getAppointmentById(leadData.linkedAppointmentId);
            setAppointment(apt);
          } catch (e) {
            console.warn('No appointment found for lead', e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Lead not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      const updated = await LeadService.updateLeadStatus(lead.id, newStatus);
      setLead(updated);
      toast.success('Status Updated', `Lead marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return;
    try {
      const updated = await LeadService.addLeadNote(lead.id, noteText);
      setLead(updated);
      setNoteText('');
      setIsNoteModalOpen(false);
      toast.success('Note Added', 'Internal note logged in timeline.');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleBookAppointment = async () => {
    if (!lead) return;
    if (!bookTime) {
      toast.error('Please select an available consultation slot');
      return;
    }
    try {
      let finalPatientId = (lead as any).convertedPatientId;
      if (!finalPatientId) {
        try {
          const convRes = await LeadService.convertLeadToPatient(lead.id);
          finalPatientId = convRes.patientId;
        } catch (convErr: any) {
          const pats = await PatientService.getPatients({ search: lead.phone, pageSize: 1 });
          if (pats.data.length > 0) {
            finalPatientId = pats.data[0].id;
          } else {
            const newPat = await PatientService.createPatient({
              name: lead.name,
              phone: lead.phone,
              email: lead.email || '',
              allergies: [],
              medicalHistoryNotes: lead.notes,
              status: 'Active',
            });
            finalPatientId = newPat.id;
          }
        }
      }

      const matchedDoc = doctorsList.find((d) => d.id === selectedDoctorId) || doctorsList[0];

      const newApt = await AppointmentService.createAppointment({
        patientId: finalPatientId,
        patientName: lead.name,
        patientPhone: lead.phone,
        doctorId: matchedDoc ? matchedDoc.id : selectedDoctorId || 'doc-01',
        doctorName: matchedDoc ? matchedDoc.name : bookDoctor,
        service: lead.interestedService,
        date: bookDate,
        time: bookTime,
        durationMinutes: 45,
        status: 'Confirmed',
        notes: `Booked for qualified lead: ${lead.notes}`,
        createdBy: 'Current User',
        leadId: lead.id,
      });

      // Update lead status to Booked
      const updatedLead = await LeadService.updateLeadStatus(lead.id, 'Booked');
      setLead(updatedLead);
      setAppointment(newApt);
      setIsBookModalOpen(false);
      toast.success('Appointment Scheduled', `Booked with ${matchedDoc ? matchedDoc.name : bookDoctor} on ${bookDate} at ${bookTime}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to book appointment');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton width="30%" height={32} style={{ marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <ErrorState
        title="Lead not found"
        message={error || "The lead you're looking for doesn't exist."}
        onRetry={() => navigate('/leads')}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Breadcrumb & Action Bar */}
      <PageHeader
        breadcrumbs={[
          { label: 'Leads', to: '/leads' },
          { label: lead.name },
        ]}
        title={lead.name}
        badge={<StatusBadge status={lead.status} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteModalOpen(true)}
              leftIcon={<FileText size={14} />}
            >
              Add Note
            </Button>
            {lead.linkedConversationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/conversations/${lead.linkedConversationId}`)}
                leftIcon={<MessageSquare size={14} color="var(--c-primary-700)" />}
              >
                Open Chat
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
              leftIcon={<Calendar size={14} />}
            >
              Book Appointment
            </Button>
          </div>
        }
      />

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Left Column: Lead Info, Qualification, Linked Appointment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Lead Profile Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
                <Select
                  options={[
                    { value: 'New', label: 'New' },
                    { value: 'Contacted', label: 'Contacted' },
                    { value: 'Qualified', label: 'Qualified' },
                    { value: 'Appointment Requested', label: 'Apt Requested' },
                    { value: 'Booked', label: 'Booked' },
                    { value: 'Lost', label: 'Lost' },
                  ]}
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  style={{ height: '30px', fontSize: '12px', padding: '0 8px' }}
                />
              </div>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Phone Number
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="var(--c-primary-700)" />
                    {lead.phone}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Email Address
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--c-slate-400)" />
                    {lead.email || 'Not provided'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Acquisition Source
                  </span>
                  <div style={{ marginTop: '2px' }}>
                    <Badge variant="neutral" size="sm">
                      {lead.source}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Assigned Coordinator
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={14} color="var(--c-primary-700)" />
                    {lead.assignedTo}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Qualification & Intent Score */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Qualification & Intent</CardTitle>
              <Badge
                variant={lead.intent === 'High' ? 'success' : lead.intent === 'Medium' ? 'warning' : 'neutral'}
                size="sm"
              >
                {lead.intent} Intent
              </Badge>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Service Interested In
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--c-primary-800)', marginTop: '2px' }}>
                    {lead.interestedService}
                  </div>
                </div>

                {lead.preferredDoctor && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Preferred Doctor
                    </span>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {lead.preferredDoctor}
                    </div>
                  </div>
                )}

                {lead.howHeardAboutDoctor && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      How They Found Us
                    </span>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {lead.howHeardAboutDoctor}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Lead Score Index
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: lead.score >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                      {lead.score} / 100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--c-slate-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${lead.score}%`,
                        height: '100%',
                        backgroundColor: lead.score >= 80 ? 'var(--status-success)' : lead.score >= 50 ? 'var(--status-warning)' : 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--c-slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-slate-600)', textTransform: 'uppercase' }}>
                    Clinical Notes & Inquiries
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-line' }}>
                    {lead.notes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Appointment Card */}
          {appointment && (
            <Card padding="md">
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--c-primary-700)" />
                  <CardTitle>Linked Clinic Appointment</CardTitle>
                </div>
                <StatusBadge status={appointment.status} size="sm" />
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDate(appointment.date)} at {appointment.time}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      With {appointment.doctorName} • {appointment.service}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/appointments/${appointment.id}`)}
                  >
                    View Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Linked Conversation & Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Linked Conversation Preview */}
          {conversation && (
            <Card padding="md">
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--c-primary-700)" />
                  <CardTitle>WhatsApp Conversation Thread</CardTitle>
                </div>
                <StatusBadge status={conversation.state} size="sm" />
              </CardHeader>

              <CardContent>
                <div
                  style={{
                    backgroundColor: 'var(--c-slate-50)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {messages.map((m) => {
                    const isPatient = m.sender === 'patient';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isPatient ? 'flex-start' : 'flex-end',
                          maxWidth: '85%',
                          backgroundColor: isPatient ? '#ffffff' : 'var(--c-primary-700)',
                          color: isPatient ? 'var(--text-primary)' : '#ffffff',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-xs)',
                          border: isPatient ? '1px solid var(--border-light)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: isPatient ? 'var(--c-slate-600)' : 'var(--c-primary-100)' }}>
                            {m.senderName}
                            {m.isAiGenerated && ' (AI)'}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.8 }}>{formatDateTime(m.timestamp)}</span>
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: 1.4 }}>{m.text}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/conversations/${conversation.id}`)}
                    rightIcon={<MessageSquare size={14} />}
                  >
                    Open Live Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--c-primary-700)" />
                <CardTitle>Lead History & Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Timeline events={lead.activities || []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Internal Lead Note"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddNote}>
              Save Note
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
            Internal Note
          </label>
          <textarea
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Record doctor consultation notes, patient follow-up phone call details, pricing expectations..."
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
      </Modal>

      {/* Quick Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`Book Appointment for ${lead.name}`}
        description={`Directly schedule clinical consultation for ${lead.interestedService}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={
                isLoadingSlots ||
                slotAvailability.isDoctorOnLeave ||
                slotAvailability.isDoctorOffDuty ||
                slotAvailability.availableSlots.length === 0 ||
                !bookTime
              }
              onClick={handleBookAppointment}
            >
              Confirm Booking
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select
            label="Assigned Doctor"
            options={
              doctorsList.length > 0
                ? doctorsList.map((d) => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
                : [{ value: '', label: 'No doctors in clinic' }]
            }
            disabled={doctorsList.length === 0}
            value={selectedDoctorId || bookDoctor}
            onChange={(e) => {
              const doc = doctorsList.find((d) => d.id === e.target.value);
              if (doc) {
                setSelectedDoctorId(doc.id);
                setBookDoctor(doc.name);
              } else {
                setBookDoctor(e.target.value);
              }
            }}
          />

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <Input
              label="Date"
              type="date"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
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
              value={bookTime}
              onChange={(e) => setBookTime(e.target.value)}
              disabled={isLoadingSlots || slotAvailability.availableSlots.length === 0}
            />
          </div>

          {/* Booked Spot Indicator */}
          {slotAvailability.bookedSlots && slotAvailability.bookedSlots.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--c-slate-500)', marginTop: '-4px' }}>
              ℹ️ {slotAvailability.bookedSlots.length} spot(s) already booked ({slotAvailability.bookedSlots.join(', ')}). Only available slots are listed.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
