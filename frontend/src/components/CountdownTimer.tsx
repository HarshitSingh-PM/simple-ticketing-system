import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  deadline: string;
  status: string;
  compact?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, status, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setIsOverdue(true);
        const overdue = Math.abs(difference);
        const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
        const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdue % (1000 * 60)) / 1000);

        setTimeLeft(
          `${days}d ${hours}h ${minutes}m ${seconds}s OVERDUE`
        );
      } else {
        setIsOverdue(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(
          `${days}d ${hours}h ${minutes}m ${seconds}s`
        );
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (status === 'Closed') {
    return compact ? (
      <div className="countdown-timer compact closed">
        <span>✓ Closed</span>
      </div>
    ) : (
      <div className="countdown-timer closed">
        <strong>Status:</strong> Ticket Closed
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`countdown-timer compact ${isOverdue ? 'overdue' : ''}`}>
        <span className="timer-icon">{isOverdue ? '⚠️' : '⏱️'}</span>
        <span className="timer-text">{timeLeft}</span>
      </div>
    );
  }

  return (
    <div className={`countdown-timer ${isOverdue ? 'overdue' : ''}`}>
      <div className="timer-label">
        {isOverdue ? 'OVERDUE BY:' : 'TIME REMAINING:'}
      </div>
      <div className="timer-value">{timeLeft}</div>
      <div className="timer-deadline">
        Deadline: {new Date(deadline).toLocaleString()}
      </div>
    </div>
  );
};

export default CountdownTimer;
