/* Full-page loading state shown while a lazy clinic route chunk loads.
 * Branded spinner so Vite suspense does not flash a blank screen. */
import React from 'react';
import { Activity } from 'lucide-react';

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--c-slate-100) 0%, var(--c-slate-50) 40%, var(--c-slate-100) 80%)',
  backgroundSize: '200% 100%',
  animation: 'cgsPageShimmer 1.4s ease-in-out infinite',
  borderRadius: 'var(--radius-sm)',
};

const Bar = ({ width, height = 12, radius = 8 }: { width: string; height?: number; radius?: number }) => (
  <div style={{ ...shimmer, width, height, borderRadius: radius }} />
);

const KpiCard = ({ accent }: { accent: string }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 18px 16px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minHeight: 118,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Bar width="42%" height={11} />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accent,
          opacity: 0.85,
        }}
      />
    </div>
    <Bar width="36%" height={26} radius={10} />
    <Bar width="58%" height={10} />
  </div>
);

export const PageFallback: React.FC = () => (
  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <style>{`
      @keyframes cgsPageShimmer {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
      @keyframes cgsPulseRing {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.7; }
      }
    `}</style>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '18px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--c-primary-100)',
        background: 'linear-gradient(135deg, #ffffff 0%, var(--c-primary-50) 100%)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'var(--c-primary-600)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 18px rgba(13, 148, 136, 0.28)',
            animation: 'cgsPulseRing 1.8s ease-in-out infinite',
          }}
        >
          <Activity size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--c-primary-900)',
              letterSpacing: '-0.02em',
            }}
          >
            Loading clinic workspace
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Fetching a live snapshot of today&apos;s operations…
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--c-primary-700)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          border: '1px solid var(--c-primary-200)',
          borderRadius: 999,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        Almost ready
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
        gap: 14,
      }}
    >
      <KpiCard accent="var(--c-primary-50)" />
      <KpiCard accent="#eff6ff" />
      <KpiCard accent="#ecfdf5" />
      <KpiCard accent="#eef2ff" />
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 16,
      }}
    >
      {[0, 1].map((col) => (
        <div
          key={col}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Bar width="46%" height={14} />
            <Bar width="18%" height={10} />
          </div>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 10,
                backgroundColor: 'var(--c-slate-50)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ ...shimmer, width: 44, height: 36, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Bar width="62%" height={12} />
                <Bar width="40%" height={9} />
              </div>
              <div style={{ ...shimmer, width: 56, height: 22, borderRadius: 999, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
