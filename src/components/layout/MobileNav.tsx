/* Bottom or drawer navigation for the clinic dashboard on small screens.
 * Same staff destinations as the desktop sidebar. */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Calendar, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { can } = useAuth();

  const items = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Leads', to: '/leads', icon: <Users size={20} /> },
    { label: 'Chats', to: '/conversations', icon: <MessageSquare size={20} /> },
    { label: 'Schedule', to: '/appointments', icon: <Calendar size={20} /> },
    can('billing.view')
      ? { label: 'Billing', to: '/billing', icon: <CreditCard size={20} /> }
      : { label: 'Alerts', to: '/notifications', icon: <Bell size={20} /> },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: '6px',
        paddingRight: '6px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        display: 'none', // Shown via CSS media query
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      }}
      className="mobile-bottom-nav"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '4px 0',
            fontSize: '10px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--c-primary-700)' : 'var(--c-slate-400)',
            textDecoration: 'none',
            flex: 1,
            height: '100%',
          })}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
