/* Top bar: clinic name, signed-in user menu, and notifications shortcut.
 * User identity comes from AuthContext, never a placeholder doctor name. */
import React, { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { NotificationService } from '../../services/notification.service';

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dynamic greeting based on time and user
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name ? (user.role === 'doctor' ? user.name : user.name.split(' ')[0]) : 'User';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutOpen(false);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="top-header"
      style={{
        height: 'var(--header-height)',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Mobile menu button & Greeting / Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          style={{
            display: 'none', // Shown via CSS media query
            background: 'none',
            border: 'none',
            color: 'var(--c-slate-600)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
          }}
          className="mobile-menu-trigger"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px',
              }}
            >
              {greeting}, {displayName}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: user?.role === 'doctor' ? 'var(--c-primary-50)' : '#fef3c7',
                color: user?.role === 'doctor' ? 'var(--c-primary-800)' : '#b45309',
                border: `1px solid ${user?.role === 'doctor' ? 'var(--c-primary-200)' : '#fde68a'}`,
                textTransform: 'capitalize',
                flexShrink: 0,
              }}
            >
              {user?.role}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
            {user?.title}
          </div>
        </div>
      </div>

      {/* Right: Notifications, User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notifications Icon with Unread Badge */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            backgroundColor: location.pathname === '/notifications' ? 'var(--c-primary-50)' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: location.pathname === '/notifications' ? 'var(--c-primary-700)' : 'var(--c-slate-600)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-error)',
                border: '2px solid #ffffff',
              }}
            />
          )}
        </button>

        {/* User Profile Dropdown */}
        <Dropdown
          trigger={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <Avatar
                name={user?.name || 'User'}
                src={user?.avatar}
                role={user?.role}
                size="md"
              />
            </div>
          }
          items={[
            {
              key: 'header-user',
              label: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              ),
              disabled: true,
            },
            'divider',
            {
              key: 'settings',
              label: 'Clinic Settings',
              icon: <User size={15} />,
              onClick: () => navigate('/settings'),
            },
            'divider',
            {
              key: 'logout',
              label: 'Logout',
              icon: <LogOut size={15} />,
              danger: true,
              onClick: () => setIsLogoutOpen(true),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={isLogoutOpen}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutOpen(false);
        }}
        title="Log out?"
        description="You will need to sign in again to use the clinic dashboard."
        maxWidth="400px"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsLogoutOpen(false)} disabled={isLoggingOut}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isLoggingOut} onClick={handleLogout}>
              Log out
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--c-slate-600)', lineHeight: 1.5 }}>
          Are you sure you want to log out{user?.name ? `, ${user.name}` : ''}?
        </p>
      </Modal>
    </header>
  );
};
