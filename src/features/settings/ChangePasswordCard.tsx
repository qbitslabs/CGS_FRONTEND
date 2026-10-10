/* Staff can replace their password. The server revokes every refresh session. */
import React, { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../../components/ui';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export const ChangePasswordCard: React.FC = () => {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      await logout();
    } catch (err: any) {
      setError(err?.message || 'Could not update password.');
      setSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div>
          <CardTitle>Password</CardTitle>
          <CardDescription>Changing your password signs you out of every clinic session.</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 420 }}>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
          {error ? <span style={{ color: 'var(--status-error)', fontSize: 13 }}>{error}</span> : null}
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};
