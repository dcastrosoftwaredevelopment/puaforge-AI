import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';

const RESEND_COOLDOWN = 60;

export function useResendCooldown() {
  const { resendVerification } = useAuth();
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0);
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async (email: string) => {
    if (!email || cooldown > 0) return;
    setResendState('loading');
    try {
      await resendVerification(email);
      setResendState('success');
      startCooldown();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      if (code === 'ERROR_ALREADY_VERIFIED') {
        navigate('/login');
        return;
      }
      setResendState('error');
    }
  };

  return { cooldown, resendState, handleResend };
}
