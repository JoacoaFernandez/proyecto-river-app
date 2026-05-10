// apps/frontend/src/components/RequireAdmin.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/me.service';

type Status = 'checking' | 'admin' | 'denied';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    getCurrentUser().then((u) => {
      setStatus(u?.role === 'admin' ? 'admin' : 'denied');
    });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed"></div>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
