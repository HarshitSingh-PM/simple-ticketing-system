import { useState, useEffect } from 'react';
import type { DepartmentAnalytics } from '../types';
import { analyticsApi } from '../api/analytics';
import './Analytics.css';

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getAnalytics();
      setAnalytics(data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalTickets = (dept: DepartmentAnalytics) => {
    return Number(dept.open_tickets) + Number(dept.closed_tickets);
  };

  const calculateSuccessRate = (dept: DepartmentAnalytics) => {
    const total = Number(dept.closed_tickets);
    if (total === 0) return 0;
    return ((Number(dept.closed_on_time) / total) * 100).toFixed(1);
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="analytics-container">
      <h2>Department Analytics</h2>

      <div className="analytics-grid">
        {analytics.map((dept) => (
          <div key={dept.department_id} className="analytics-card">
            <div className="analytics-card-header">
              <h3>{dept.department_name}</h3>
              <span className="total-tickets">{calculateTotalTickets(dept)} Total</span>
            </div>

            <div className="analytics-stats">
              <div className="stat-item open">
                <div className="stat-label">Open Tickets</div>
                <div className="stat-value">{dept.open_tickets}</div>
              </div>

              <div className="stat-item closed">
                <div className="stat-label">Closed Tickets</div>
                <div className="stat-value">{dept.closed_tickets}</div>
              </div>

              <div className="stat-item success">
                <div className="stat-label">Closed On Time</div>
                <div className="stat-value">{dept.closed_on_time}</div>
              </div>

              <div className="stat-item delayed">
                <div className="stat-label">Closed Delayed</div>
                <div className="stat-value">{dept.closed_delayed}</div>
              </div>
            </div>

            {Number(dept.closed_tickets) > 0 && (
              <div className="success-rate">
                <div className="success-rate-label">Success Rate:</div>
                <div className="success-rate-value">{calculateSuccessRate(dept)}%</div>
                <div className="success-rate-bar">
                  <div
                    className="success-rate-fill"
                    style={{ width: `${calculateSuccessRate(dept)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {analytics.length === 0 && (
        <div className="no-analytics">No analytics data available yet.</div>
      )}
    </div>
  );
};
