import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import type { Ticket } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import { Analytics } from '../components/Analytics';
import './TicketList.css';

type TabType = 'all' | 'open' | 'closed' | 'assigned' | 'analytics';

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      let data: Ticket[];

      switch (activeTab) {
        case 'all':
          data = await ticketsApi.getAll();
          break;
        case 'open':
          data = await ticketsApi.getByStatus('open');
          break;
        case 'closed':
          data = await ticketsApi.getByStatus('closed');
          break;
        case 'assigned':
          data = await ticketsApi.getMyDepartment();
          break;
        default:
          data = [];
      }

      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'status-open';
      case 'Pending':
        return 'status-pending';
      case 'Closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  const isOverdue = (ticket: Ticket) => {
    if (ticket.status === 'Closed') return false;
    return new Date(ticket.deadline) < new Date();
  };

  return (
    <div className="ticket-list-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Ticketing System</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            {user?.isAdmin && <span className="admin-badge">Admin</span>}
            <button onClick={() => navigate('/change-password')} className="btn-secondary">
              Change Password
            </button>
            {user?.isAdmin && (
              <button onClick={() => navigate('/admin')} className="btn-secondary">
                Admin Settings
              </button>
            )}
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="content-header">
          <h2>Tickets</h2>
          <button onClick={() => navigate('/tickets/new')} className="btn-primary">
            + Create Ticket
          </button>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'all' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('all')}
          >
            All Tickets
          </button>
          <button
            className={activeTab === 'open' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('open')}
          >
            Open Tickets
          </button>
          <button
            className={activeTab === 'closed' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('closed')}
          >
            Closed Tickets
          </button>
          <button
            className={activeTab === 'assigned' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned To Me
          </button>
          <button
            className={activeTab === 'analytics' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <Analytics />
        ) : isLoading ? (
          <div className="loading">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="no-tickets">No tickets found</div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-card ${isOverdue(ticket) ? 'overdue' : ''}`}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="ticket-header">
                  <h3>#{ticket.id} - {ticket.title}</h3>
                  <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="ticket-description">{ticket.description}</p>
                <div className="ticket-timer">
                  <CountdownTimer deadline={ticket.deadline} status={ticket.status} compact={true} />
                </div>
                <div className="ticket-meta">
                  {ticket.customer_name && (
                    <div>
                      <strong>Customer:</strong> {ticket.customer_name}
                    </div>
                  )}
                  {ticket.customer_mobile && (
                    <div>
                      <strong>Mobile:</strong> {ticket.customer_mobile}
                    </div>
                  )}
                  {ticket.car_bought && (
                    <div>
                      <strong>Car:</strong> {ticket.car_bought}
                    </div>
                  )}
                  <div>
                    <strong>Department:</strong> {ticket.department_name}
                  </div>
                  <div>
                    <strong>Created by:</strong> {ticket.creator_name}
                  </div>
                  <div>
                    <strong>Deadline:</strong>{' '}
                    <span className={isOverdue(ticket) ? 'overdue-text' : ''}>
                      {new Date(ticket.deadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
