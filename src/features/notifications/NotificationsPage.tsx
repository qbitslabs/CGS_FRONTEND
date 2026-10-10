/* Staff notification list: enquiries, invoices, and appointment changes.
 * Marks items read and deep-links to the related clinic record. */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Users,
  Calendar,
  Settings,
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import {
  PageHeader,
  Button,
  ExportExcelButton,
  Tabs,
  Badge,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const list = await NotificationService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      const updated = await NotificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all read');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'New Lead':
        return <Users size={16} color="var(--c-primary-700)" />;
      case 'Appointment Reminder':
      case 'Appointment Change':
        return <Calendar size={16} color="var(--status-success)" />;
      case 'Invoice':
        return <Bell size={16} color="var(--c-primary-700)" />;
      case 'System Notification':
        return <Settings size={16} color="var(--c-slate-500)" />;
      default:
        return <Bell size={16} color="var(--c-slate-500)" />;
    }
  };

  // Filter based on tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'leads') return n.type === 'New Lead';
    if (activeTab === 'appointments') return n.type === 'Appointment Reminder' || n.type === 'Appointment Change';
    if (activeTab === 'invoices') return n.type === 'Invoice';
    if (activeTab === 'system') return n.type === 'System Notification';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Notification Center"
        description="Alerts for new enquiries, invoices, and appointment changes. Chats stay on the Conversations badge."
        badge={
          unreadCount > 0 ? (
            <Badge variant="warning" size="sm">
              {unreadCount} Unread
            </Badge>
          ) : undefined
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ExportExcelButton
              filename="notifications"
              headers={['Type', 'Title', 'Message', 'Time', 'Read']}
              rows={notifications.map((notif) => [
                notif.type,
                notif.title,
                notif.message,
                formatDateTime(notif.timestamp),
                notif.isRead ? 'Read' : 'Unread',
              ])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              leftIcon={<CheckCheck size={14} />}
            >
              Mark All as Read
            </Button>
          </div>
        }
      />

      {/* Tabs Filter */}
      <Tabs
        tabs={[
          { key: 'all', label: 'All Notifications', badge: <span style={{ fontSize: '11px' }}>({notifications.length})</span> },
          { key: 'unread', label: 'Unread Only', badge: unreadCount > 0 ? <span style={{ fontSize: '11px', color: 'var(--status-warning)', fontWeight: 700 }}>({unreadCount})</span> : undefined },
          { key: 'leads', label: 'Enquiries' },
          { key: 'appointments', label: 'Appointments' },
          { key: 'invoices', label: 'Invoices' },
          { key: 'system', label: 'System' },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Notifications List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} color="var(--c-slate-400)" />}
          title="No notifications in this category"
          description="You are completely caught up! New operational events will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id, notif.link)}
              style={{
                backgroundColor: notif.isRead ? '#ffffff' : 'var(--c-primary-50)',
                border: `1px solid ${notif.isRead ? 'var(--border-light)' : 'var(--c-primary-200)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: notif.link ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (notif.link) e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                if (notif.link) e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: notif.isRead ? 'var(--c-slate-100)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {getNotificationIcon(notif.type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: notif.isRead ? 600 : 700, color: 'var(--text-primary)' }}>
                      {notif.title}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {notif.type}
                    </Badge>
                    {!notif.isRead && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-error)',
                        }}
                      />
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDateTime(notif.timestamp)}
                </span>

                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
                    style={{ fontSize: '11px', height: '24px', padding: '0 6px' }}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
