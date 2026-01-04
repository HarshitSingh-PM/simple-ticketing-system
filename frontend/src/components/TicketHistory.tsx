import { useEffect, useState } from 'react';
import type { TicketHistory } from '../types';
import { ticketsApi } from '../api/tickets';
import './TicketHistory.css';

interface TicketHistoryProps {
  ticketId: number;
}

export const TicketHistoryComponent = ({ ticketId }: TicketHistoryProps) => {
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await ticketsApi.getHistory(ticketId);
        setHistory(data);
        setError('');
      } catch (err) {
        setError('Failed to load ticket history');
        console.error('Error fetching ticket history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [ticketId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return '✨';
      case 'status_changed':
        return '🔄';
      case 'reassigned':
        return '👥';
      case 'field_updated':
        return '✏️';
      default:
        return '📝';
    }
  };

  const getChangeDescription = (item: TicketHistory) => {
    if (item.description) {
      return item.description;
    }

    if (item.field_name && item.old_value && item.new_value) {
      return `Updated ${item.field_name} from "${item.old_value}" to "${item.new_value}"`;
    }

    return `${item.change_type} change`;
  };

  if (loading) {
    return <div className="history-loading">Loading history...</div>;
  }

  if (error) {
    return <div className="history-error">{error}</div>;
  }

  if (history.length === 0) {
    return <div className="history-empty">No history available for this ticket.</div>;
  }

  return (
    <div className="ticket-history">
      <h3>Ticket History</h3>
      <div className="history-timeline">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <div className="history-icon">{getChangeIcon(item.change_type)}</div>
            <div className="history-content">
              <div className="history-header">
                <span className="history-user">
                  {item.changer_name}
                  {item.changer_department && (
                    <span className="history-department"> ({item.changer_department})</span>
                  )}
                </span>
                <span className="history-date">{formatDate(item.created_at)}</span>
              </div>
              <div className="history-description">{getChangeDescription(item)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
