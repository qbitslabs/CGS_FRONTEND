/* Clinic home: compact KPI cards, today's visits, chats count, recent activity.
 * Reads live dashboard summary; fourth card is conversation count only. */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Button,
  StatusBadge,
  PageHeader,
  Timeline,
  CardSkeleton,
  TableSkeleton,
  Select,
} from '../../components/ui';
import { DashboardService, DashboardSummary } from '../../services/dashboard.service';
import { ClinicServiceApi } from '../../services/clinic.service';
import { Doctor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userSeesAllClinicData } from '../../permissions';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const seesAll = userSeesAllClinicData(user);

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('All');

  useEffect(() => {
    if (seesAll) {
      ClinicServiceApi.getDoctors().then(setDoctors).catch(() => setDoctors([]));
    }
  }, [seesAll]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        setSummary(await DashboardService.getSummary(seesAll ? doctorFilter : user?.doctorId));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [doctorFilter, seesAll, user?.doctorId]);

  const newLeadsCount = summary?.newLeadsCount || 0;
  const activeLeadsCount = summary?.activeLeadsCount || 0;
  const todayAppointments = summary?.todayAppointments || [];
  const chatsCount = summary?.activeConversationsCount || 0;
  const conversations = summary?.recentConversations || [];
  const dashboardActivities = summary?.activities || [];

  const funnelStages = [
    { label: 'New', count: summary?.funnel.new || 0, color: 'var(--status-info)' },
    { label: 'Contacted', count: summary?.funnel.contacted || 0, color: 'var(--c-primary-600)' },
    { label: 'Qualified', count: summary?.funnel.qualified || 0, color: 'var(--status-warning)' },
    { label: 'Apt Requested', count: summary?.funnel.appointmentRequested || 0, color: 'var(--status-ai)' },
    { label: 'Booked', count: summary?.funnel.booked || 0, color: 'var(--status-success)' },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Clinic Operations Dashboard" description="Live overview of patient acquisition, schedule, and communications" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Page Header */}
      <PageHeader
        title="Clinic Operations Dashboard"
        description={`Welcome back, ${user?.name}. Here is your clinic's operational performance today.`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {seesAll && doctors.length > 0 && (
              <Select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All doctors' },
                  ...(user?.doctorId ? [{ value: user.doctorId, label: 'My records' }] : []),
                  ...doctors
                    .filter((d) => d.id !== user?.doctorId)
                    .map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/appointments')}
              leftIcon={<Calendar size={14} />}
            >
              View Calendar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/leads')}
              leftIcon={<Users size={14} />}
            >
              Manage Leads
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          compact
          title="New Leads"
          value={newLeadsCount}
          icon={<Users size={16} />}
          iconBg="var(--c-primary-50)"
          iconColor="var(--c-primary-700)"
          onClick={() => navigate('/leads')}
        />

        <StatCard
          compact
          title="Active Leads"
          value={activeLeadsCount}
          icon={<TrendingUp size={16} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          onClick={() => navigate('/leads')}
        />

        <StatCard
          compact
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={<Calendar size={16} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
          onClick={() => navigate('/appointments')}
        />

        <StatCard
          compact
          title="Chats"
          value={chatsCount}
          icon={<MessageSquare size={16} />}
          iconBg="#eef2ff"
          iconColor="#6366f1"
          onClick={() => navigate('/conversations')}
        />
      </div>

      {/* Lead Pipeline Overview Bar */}
      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Lead Pipeline Flow</CardTitle>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time patient journey from initial inquiry to booked consultation
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/leads')}
            rightIcon={<ArrowRight size={14} />}
          >
            View All Leads
          </Button>
        </CardHeader>

        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
              gap: '12px',
              padding: '12px 0',
            }}
          >
            {funnelStages.map((stage, idx) => (
              <div
                key={stage.label}
                style={{
                  backgroundColor: 'var(--c-slate-50)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-light)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: stage.color,
                  }}
                />
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-slate-500)', textTransform: 'uppercase' }}>
                  {idx + 1}. {stage.label}
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)',
                    marginTop: '4px',
                  }}
                >
                  {stage.count}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Today's Appointments & Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '20px',
        }}
      >
        {/* Today's Appointments List */}
        <Card padding="md" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--c-primary-700)" />
              <CardTitle>Today&apos;s Appointments</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/appointments')}
              rightIcon={<ArrowRight size={14} />}
            >
              Full Schedule
            </Button>
          </CardHeader>

          <CardContent style={{ flex: 1 }}>
            {todayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                No appointments scheduled for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--c-slate-50)',
                      border: '1px solid var(--border-light)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: '70px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-primary-800)' }}>
                        {apt.time}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {apt.durationMinutes} mins
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {apt.patientName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {apt.service} • <span style={{ color: 'var(--c-slate-700)' }}>{apt.doctorName}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={apt.status} size="sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                        style={{ padding: '4px 8px', height: '28px', fontSize: '11px' }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card padding="md" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--c-primary-700)" />
              <CardTitle>Recent Patient Conversations</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/conversations')}
              rightIcon={<ArrowRight size={14} />}
            >
              Open Inbox
            </Button>
          </CardHeader>

          <CardContent style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {conversations.slice(0, 4).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    gap: '12px',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--c-slate-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {conv.participantName.split(' ')[0]}
                      </span>
                      <StatusBadge status={conv.state} size="sm" />
                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            lineHeight: 1,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--status-error)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {conv.unreadCount} new
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatDateTime(conv.lastMessageTime)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline Row */}
      <Card padding="md">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--c-primary-700)" />
            <CardTitle>Recent Clinic Operations Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Timeline events={dashboardActivities} />
        </CardContent>
      </Card>
    </div>
  );
};
