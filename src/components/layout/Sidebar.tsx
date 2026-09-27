/* Clinic sidebar nav with an unread Conversations badge.
 * Badge is unseen-only; red for critical, yellow for handoff, then clears when seen. */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MessageSquare,
  Calendar,
  CreditCard,
  Bell,
  Settings,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Permission } from '../../types';
import { LeadService } from '../../services/lead.service';
import { ConversationService } from '../../services/conversation.service';
import { NotificationService } from '../../services/notification.service';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user, can } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState<{
    leads: number;
    conversations: number;
    conversationTone: 'normal' | 'handoff' | 'critical';
    notifications: number;
  }>({
    leads: 0,
    conversations: 0,
    conversationTone: 'normal',
    notifications: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLiveCounters = async () => {
      try {
        const [leadsRes, convsRes, unreadNotifs] = await Promise.allSettled([
          LeadService.getLeads({ status: 'New', pageSize: 1 }),
          ConversationService.getSidebarBadge(),
          NotificationService.getUnreadCount(),
        ]);

        if (!isMounted) return;

        const newLeadsCount =
          leadsRes.status === 'fulfilled' ? leadsRes.value.total || 0 : 0;

        const convBadge = convsRes.status === 'fulfilled' ? convsRes.value : { count: 0, tone: 'normal' as const };

        const notifsCount =
          unreadNotifs.status === 'fulfilled' ? unreadNotifs.value || 0 : 0;

        setCounts({
          leads: newLeadsCount,
          conversations: convBadge.count || 0,
          conversationTone: convBadge.tone || 'normal',
          notifications: notifsCount,
        });
      } catch {
        // Ignore network errors in sidebar
      }
    };

    fetchLiveCounters();
    const interval = setInterval(fetchLiveCounters, 30000);
    const onSeen = () => {
      void fetchLiveCounters();
    };
    window.addEventListener('cgs:conversations-seen', onSeen);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('cgs:conversations-seen', onSeen);
    };
  }, [location.pathname]);

  const allNavItems: {
    label: string;
    to: string;
    icon: React.ReactNode;
    badge?: string;
    badgeTone?: 'normal' | 'handoff' | 'critical';
    permission?: Permission;
  }[] = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} />, permission: 'dashboard.view' },
    {
      label: 'Leads',
      to: '/leads',
      icon: <Users size={18} />,
      badge: counts.leads > 0 ? String(counts.leads) : undefined,
      permission: 'leads.view',
    },
    { label: 'Patients', to: '/patients', icon: <UserCheck size={18} />, permission: 'patients.view' },
    {
      label: 'Conversations',
      to: '/conversations',
      icon: <MessageSquare size={18} />,
      badge: counts.conversations > 0 ? String(counts.conversations) : undefined,
      badgeTone: counts.conversationTone,
      permission: 'conversations.view',
    },
    { label: 'Appointments', to: '/appointments', icon: <Calendar size={18} />, permission: 'appointments.view' },
    { label: 'Billing', to: '/billing', icon: <CreditCard size={18} />, permission: 'billing.view' },
    {
      label: 'Notifications',
      to: '/notifications',
      icon: <Bell size={18} />,
      badge: counts.notifications > 0 ? String(counts.notifications) : undefined,
      permission: 'notifications.view',
    },
    { label: 'Settings', to: '/settings', icon: <Settings size={18} />, permission: 'settings.view' },
  ];

  // Filter items based on user permissions.
  // Doctor has 'billing.view' -> Billing shows.
  // Employee does NOT have 'billing.view' -> Billing is strictly hidden.
  const navItems = allNavItems.filter((item) => !item.permission || can(item.permission));

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 40,
        flexShrink: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--c-primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(15, 118, 110, 0.4)',
          }}
        >
          <Activity size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Clinic Growth
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--c-slate-400)',
              letterSpacing: '0.02em',
            }}
          >
            User Dashboard
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div
        style={{
          margin: '16px 16px 8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <ShieldCheck
          size={16}
          color={user?.role === 'doctor' ? 'var(--c-primary-400)' : '#fbbf24'}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--c-slate-400)', textTransform: 'uppercase' }}>
            Current Mode
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: user?.role === 'doctor' ? 'var(--c-primary-300)' : '#fef08a',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.role === 'doctor' ? 'Doctor Portal' : 'Employee Portal'}
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav
        style={{
          flex: 1,
          padding: '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--c-slate-300)',
              backgroundColor: isActive ? 'var(--c-primary-700)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.backgroundColor = 'var(--bg-sidebar-hover)';
                target.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.backgroundColor = 'transparent';
                target.style.color = 'var(--c-slate-300)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor:
                    item.badgeTone === 'critical'
                      ? '#dc2626'
                      : item.badgeTone === 'handoff'
                        ? '#eab308'
                        : 'rgba(255, 255, 255, 0.15)',
                  color: item.badgeTone === 'handoff' ? '#422006' : '#ffffff',
                  boxShadow:
                    item.badgeTone === 'critical'
                      ? '0 0 0 2px rgba(220, 38, 38, 0.35)'
                      : undefined,
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '11px',
          color: 'var(--c-slate-400)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ color: 'var(--c-slate-300)', fontWeight: 500 }}>Clinic Growth System</div>
        <div>Version 2.4.0 (Clinic SaaS)</div>
      </div>
    </aside>
  );
};
