import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime] = useState(() => Math.max(0, expiresAt.getTime() - Date.now()));

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const seconds = Math.ceil(timeLeft / 1000);
  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isUrgent = seconds <= 30;

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full border-4 transition-colors animate-countdown',
          isUrgent ? 'border-destructive' : 'border-primary'
        )}
        style={{
          background: `conic-gradient(${
            isUrgent ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
          } ${progress}%, transparent ${progress}%)`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center">
          <span
            className={cn(
              'text-lg font-bold tabular-nums',
              isUrgent ? 'text-destructive' : 'text-primary'
            )}
          >
            {seconds}s
          </span>
        </div>
      </div>
    </div>
  );
}
