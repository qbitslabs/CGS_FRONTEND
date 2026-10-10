/* Patient chart: demographics, visit history, and activity timeline.
 * Staff edit notes and jump to linked appointments or chats. */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  AlertTriangle,
  HeartPulse,
  User,
  Clock,
  MapPin,
  FileText,
  Plus,
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
  Skeleton,
  ErrorState,
  useToast,
} from '../../components/ui';
import { PatientService } from '../../services/patient.service';
import { Appointment, Conversation, Patient } from '../../types';
import { CreateInvoiceModal } from '../billing/CreateInvoiceModal';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const p = await PatientService.getPatientById(id);
        setPatient(p);
        setAppointments((p.appointments || []) as Appointment[]);
        setConversations((p.conversations || []) as Conversation[]);
      } catch (err: any) {
        setError(err.message || 'Patient not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const handleAddClinicalNote = async () => {
    if (!patient || !noteText.trim()) return;
    try {
      const updated = await PatientService.addPatientNote(patient.id, noteText);
      setPatient(updated);
      setNoteText('');
      setIsNoteModalOpen(false);
      toast.success('Clinical Note Saved', 'Observation added to medical timeline.');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton width="30%" height={32} style={{ marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <Skeleton height={320} />
          <Skeleton height={320} />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <ErrorState
        title="Patient Record Not Found"
        message={error || "The patient chart you're looking for doesn't exist."}
        onRetry={() => navigate('/patients')}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Patients', to: '/patients' },
          { label: patient.name },
        ]}
        title={patient.name}
        badge={<StatusBadge status={patient.status} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteModalOpen(true)}
              leftIcon={<FileText size={14} />}
            >
              Add Clinical Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(true)}
              leftIcon={<FileText size={14} />}
            >
              Create Invoice
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/appointments')}
              leftIcon={<Calendar size={14} />}
            >
              Schedule Appointment
            </Button>
          </div>
        }
      />

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Left Column: Demographics, Medical Record */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Patient Profile */}
          <Card padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--c-primary-700)" />
                <CardTitle>Patient Profile & Demographics</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                ID: {patient.id}
              </Badge>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Phone Number
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="var(--c-primary-700)" />
                    {patient.phone}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Email Address
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--c-slate-400)" />
                    {patient.email}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Demographics
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {[patient.gender, patient.age != null ? `${patient.age} years old` : null]
                      .filter(Boolean)
                      .join(' • ') || 'Gender / age not set'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Blood Group
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-error)', marginTop: '2px' }}>
                    {patient.bloodGroup || 'Not recorded'}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Residential Address
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--c-slate-400)" />
                    {patient.address || 'Bengaluru, Karnataka'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History & Allergies */}
          <Card padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={18} color="var(--status-error)" />
                <CardTitle>Medical History & Contraindications</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Allergies Highlight */}
                <div
                  style={{
                    backgroundColor: patient.allergies?.some((a) => a !== 'None')
                      ? 'var(--status-error-bg)'
                      : 'var(--c-slate-50)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${
                      patient.allergies?.some((a) => a !== 'None')
                        ? 'var(--status-error-border)'
                        : 'var(--border-light)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    color={
                      patient.allergies?.some((a) => a !== 'None')
                        ? 'var(--status-error)'
                        : 'var(--c-slate-400)'
                    }
                  />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--c-slate-700)' }}>
                      Drug & Medical Allergies
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: patient.allergies?.some((a) => a !== 'None') ? 'var(--status-error)' : 'var(--c-slate-600)' }}>
                      {patient.allergies?.join(', ') || 'None reported'}
                    </div>
                  </div>
                </div>

                {/* Medical History Text */}
                <div
                  style={{
                    backgroundColor: 'var(--c-slate-50)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-slate-600)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Clinical History & Treatment Notes
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {patient.medicalHistoryNotes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Appointments History & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Appointment History */}
          <Card padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--c-primary-700)" />
                <CardTitle>Appointments ({appointments.length})</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/appointments')}
                leftIcon={<Plus size={13} />}
              >
                Schedule
              </Button>
            </CardHeader>

            <CardContent>
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  No appointments logged for this patient.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--c-slate-50)',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatDate(apt.date)} • {apt.time}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {apt.service} • {apt.doctorName}
                        </div>
                      </div>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Conversations */}
          {conversations.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--c-primary-700)" />
                  <CardTitle>Linked Conversations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => navigate(`/conversations/${conv.id}`)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusBadge status={conv.state} size="sm" />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDateTime(conv.lastMessageTime)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chronological Patient Activity */}
          <Card padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--c-primary-700)" />
                <CardTitle>Patient Clinical Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Timeline events={patient.activities || []} />
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        presetPatientId={patient.id}
        onCreated={() => toast.success('Invoice created', 'Invoice added to billing ledger.')}
      />

      {/* Add Clinical Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Clinical Note"
        description={`Record medical findings, prescription notes, or consultation followups for ${patient.name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddClinicalNote}>
              Save to Medical Record
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Completed periodic 3D aligner review. Delivered tray 15 to 18. Tooth tracking on schedule..."
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
    </div>
  );
};
