import { useState, useEffect } from 'react';
import type { EmailStats as EmailStatsType } from '../types';
import { analyticsApi } from '../api/analytics';
import './EmailStats.css';

export const EmailStats = () => {
  const [emailStats, setEmailStats] = useState<EmailStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchEmailStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchEmailStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmailStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getEmailStats();
      setEmailStats(data);
      setError('');
    } catch (err) {
      setError('Failed to load email statistics');
      console.error('Error fetching email stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEmailType = (type: string): string => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading && !emailStats) {
    return <div className="email-stats-loading">Loading email statistics...</div>;
  }

  if (error && !emailStats) {
    return <div className="email-stats-error">{error}</div>;
  }

  if (!emailStats) {
    return null;
  }

  return (
    <div className="email-stats-container">
      <div className="email-stats-header">
        <h2>Email Statistics</h2>
        <span className="email-stats-subtitle">Monitor your email usage</span>
      </div>

      <div className="email-stats-grid">
        {/* Today's Stats Card */}
        <div className="email-stat-card today">
          <div className="email-stat-card-header">
            <h3>Today</h3>
            <div className="email-total-badge">{emailStats.today.total}</div>
          </div>

          <div className="email-stat-details">
            <div className="email-stat-row success">
              <span className="label">Successful:</span>
              <span className="value">{emailStats.today.successful}</span>
            </div>
            {emailStats.today.failed > 0 && (
              <div className="email-stat-row failed">
                <span className="label">Failed:</span>
                <span className="value">{emailStats.today.failed}</span>
              </div>
            )}
          </div>

          {emailStats.today.byType.length > 0 && (
            <div className="email-breakdown">
              <div className="breakdown-title">Breakdown by Type:</div>
              {emailStats.today.byType.map((item) => (
                <div key={item.email_type} className="breakdown-item">
                  <span className="breakdown-label">{formatEmailType(item.email_type)}</span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Month's Stats Card */}
        <div className="email-stat-card month">
          <div className="email-stat-card-header">
            <h3>This Month</h3>
            <div className="email-total-badge">{emailStats.month.total}</div>
          </div>

          {emailStats.month.byType.length > 0 && (
            <div className="email-breakdown">
              <div className="breakdown-title">Breakdown by Type:</div>
              {emailStats.month.byType.map((item) => (
                <div key={item.email_type} className="breakdown-item">
                  <span className="breakdown-label">{formatEmailType(item.email_type)}</span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {emailStats.today.total === 0 && emailStats.month.total === 0 && (
        <div className="no-emails">No emails sent yet.</div>
      )}
    </div>
  );
};
