/* Authenticated clinic shell: sidebar, top header, and page outlet.
 * Keeps staff navigation fixed while the main pane scrolls. */
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Automatically reset scroll position to the top on every route change
  useEffect(() => {
    sessionStorage.setItem('cgs_active_route', location.pathname);

    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-app)',
        width: '100vw',
      }}
    >
      {/* Desktop Sidebar */}
      <div
        className="desktop-sidebar-container"
        style={{
          width: 'var(--sidebar-width)',
          height: '100%',
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
          }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'var(--sidebar-width)', height: '100%' }}>
            <Sidebar isOpen={true} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Container - independently scrollable */}
      <div
        ref={mainScrollRef}
        className="main-scroll-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <TopHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main
          style={{
            flex: 1,
            padding: '24px',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
          className="main-content-area"
        >
          <Outlet />
        </main>

        <MobileNav />
      </div>
    </div>
  );
};
