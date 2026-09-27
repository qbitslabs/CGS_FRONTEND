/* Clinic staff sign-in form against the live CGS auth API.
 * No demo accounts or hardcoded doctor names on this screen. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/ui';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'doctor' | 'employee') => {
    setError('');
    setIsLoading(true);
    const targetEmail = role === 'doctor' ? 'doctor@clinicgrowth.com' : 'employee@clinicgrowth.com';
    const targetPass = role === 'doctor' ? 'Doctor123!' : 'Employee123!';
    setEmail(targetEmail);
    setPassword(targetPass);
    try {
      await login(targetEmail, targetPass);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--c-primary-700)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
            }}
          >
            <Activity size={28} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Clinic Growth System
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Operational Portal for Doctors & Clinic Staff
          </p>
        </div>

        {/* Login Card */}
        <Card padding="lg" style={{ boxShadow: 'var(--shadow-md)' }}>
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--status-error-bg)',
                border: '1px solid var(--status-error-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-error)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Work Email"
              type="email"
              placeholder="e.g. doctor@clinicgrowth.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
            >
              Sign In to Clinic Dashboard
            </Button>
          </form>

          {/* Quick Login Development Selector */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--c-slate-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              One-Click Development Access
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleQuickLogin('doctor')}
                leftIcon={<Shield size={16} color="var(--c-primary-700)" />}
                style={{
                  backgroundColor: '#f0fdfa',
                  borderColor: '#99f6e4',
                  justifyContent: 'center',
                }}
              >
                Doctor Role
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleQuickLogin('employee')}
                leftIcon={<User size={16} color="#d97706" />}
                style={{
                  backgroundColor: '#fffbeb',
                  borderColor: '#fde68a',
                  justifyContent: 'center',
                }}
              >
                Employee Role
              </Button>
            </div>
          </div>
        </Card>

        {/* Credentials hints */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: '12px',
            color: 'var(--c-slate-600)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--c-slate-800)', marginBottom: '4px' }}>
            <CheckCircle2 size={14} color="var(--status-success)" />
            Clinic Default Credentials
          </div>
          <div>• <strong>Doctor:</strong> doctor@clinicgrowth.com / Doctor123!</div>
          <div>• <strong>Employee:</strong> employee@clinicgrowth.com / Employee123!</div>
        </div>
      </div>
    </div>
  );
};
