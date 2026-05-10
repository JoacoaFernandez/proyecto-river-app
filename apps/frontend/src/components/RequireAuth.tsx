// apps/frontend/src/components/RequireAuth.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface Props {
  children: ReactNode;
}

type Status = 'checking' | 'ok' | 'forbidden';

export default function RequireAuth({ children }: Props) {
  const [status, setStatus] = useState<Status>('checking');
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('river_app_token');
    if (!token) {
      setStatus('forbidden');
      return;
    }

    api
      .get('/auth/me')
      .then(() => setStatus('ok'))
      .catch(() => {
        localStorage.removeItem('river_app_token');
        setStatus('forbidden');
      });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed"></div>
      </div>
    );
  }

  if (status === 'forbidden') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
