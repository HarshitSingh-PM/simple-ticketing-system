import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { departmentsApi } from '../api/departments';
import type { Ticket, Department } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import { TicketHistoryComponent } from '../components/TicketHistory';
import { TicketComments } from '../components/TicketComments';
import './TicketDetail.css';

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [newDeadline, setNewDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTicket();
    loadDepartments();
  }, [id]);

  const loadTicket = async () => {
    try {
      const data = await ticketsApi.getById(Number(id));
      setTicket(data);
      setSelectedStatus(data.status);
      setSelectedDepartment(data.assigned_department_id);
      setNewDeadline(new Date(data.deadline).toISOString().slice(0, 16));
    } catch (error) {
      console.error('Error loading ticket:', error);
      setError('Failed to load ticket');
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const canEditDeadline = () => {
    if (!user || !ticket) return false;
    return user.isAdmin || ticket.created_by === user.id;
  };

  const handleStatusChange = async () => {
    if (!ticket || selectedStatus === ticket.status) return;

    setIsLoading(true);
    setError('');

    try {
      await ticketsApi.update(ticket.id, { status: selectedStatus as any });
      alert('Status updated successfully!');
      await loadTicket();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentChange = async () => {
    if (!ticket || selectedDepartment === ticket.assigned_department_id) return;

    setIsLoading(true);
    setError('');

    try {
      await ticketsApi.update(ticket.id, {
        assigned_department_id: Number(selectedDepartment),
      });
      alert('Department reassigned successfully! Email notification sent.');
      await loadTicket();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reassign department');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeadlineChange = async () => {
    if (!ticket || !canEditDeadline()) return;

    setIsLoading(true);
    setError('');

    try {
      await ticketsApi.update(ticket.id, {
        deadline: new Date(newDeadline).toISOString(),
      });
      alert('Deadline updated successfully!');
      await loadTicket();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update deadline');
    } finally {
      setIsLoading(false);
    }
  };

  if (!ticket) {
    return (
      <div className="ticket-detail-container">
        <div className="loading">Loading ticket...</div>
      </div>
    );
  }

  const canUserActOnTicket = user?.departmentId === ticket.assigned_department_id || user?.isAdmin;

  return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-box">
        <div className="page-header">
          <h1>Ticket #{ticket.id}</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to List
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="ticket-content-layout">
          <div className="ticket-main-content">
            <div className="ticket-info">
          <h2>{ticket.title}</h2>

          <div className="info-grid">
            <div className="info-item">
              <strong>Status:</strong>
              <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </span>
            </div>
            <div className="info-item">
              <strong>Created by:</strong> {ticket.creator_name} ({ticket.creator_email})
            </div>
            <div className="info-item">
              <strong>Assigned to:</strong> {ticket.department_name}
            </div>
            <div className="info-item">
              <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
            </div>
            {ticket.closed_at && (
              <div className="info-item">
                <strong>Closed:</strong> {new Date(ticket.closed_at).toLocaleString()}
              </div>
            )}
          </div>

          {(ticket.customer_name || ticket.customer_mobile || ticket.car_bought) && (
            <div className="info-grid">
              <h3 style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>Customer Information</h3>
              {ticket.customer_name && (
                <div className="info-item">
                  <strong>Customer Name:</strong> {ticket.customer_name}
                </div>
              )}
              {ticket.customer_mobile && (
                <div className="info-item">
                  <strong>Customer Mobile:</strong> {ticket.customer_mobile}
                </div>
              )}
              {ticket.car_bought && (
                <div className="info-item">
                  <strong>Car Bought:</strong> {ticket.car_bought}
                </div>
              )}
            </div>
          )}

          <div className="description-section">
            <h3>Description</h3>
            <p>{ticket.description}</p>
            {ticket.description_image_url && (
              <div style={{ marginTop: '1rem' }}>
                <img
                  src={`http://localhost:5001${ticket.description_image_url}`}
                  alt="Ticket description"
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '4px', border: '1px solid #dee2e6' }}
                />
              </div>
            )}
            {!user?.isAdmin && (
              <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block', fontStyle: 'italic' }}>
                Note: Only admins can edit the ticket description.
              </small>
            )}
          </div>
            </div>

            <TicketComments ticketId={ticket.id} />

            <TicketHistoryComponent ticketId={ticket.id} />
          </div>

          <div className="ticket-sidebar">
            <CountdownTimer deadline={ticket.deadline} status={ticket.status} />

            {canUserActOnTicket && (
              <div className="actions-section">
                <h3>Actions</h3>

                <div className="action-group">
                  <label>Change Status</label>
                  <div className="action-controls">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <button
                      onClick={handleStatusChange}
                      disabled={isLoading || selectedStatus === ticket.status}
                      className="btn-primary"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="action-group">
                  <label>Reassign Department</label>
                  <div className="action-controls">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(Number(e.target.value))}
                      disabled={isLoading}
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleDepartmentChange}
                      disabled={isLoading || selectedDepartment === ticket.assigned_department_id}
                      className="btn-primary"
                    >
                      Reassign
                    </button>
                  </div>
                </div>

                {canEditDeadline() && (
                  <div className="action-group">
                    <label>Edit Deadline</label>
                    <div className="action-controls">
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleDeadlineChange}
                        disabled={isLoading}
                        className="btn-primary"
                      >
                        Update
                      </button>
                    </div>
                    <small>Only admin or ticket creator can edit deadline</small>
                  </div>
                )}
              </div>
            )}

            {!canUserActOnTicket && (
              <div className="info-message">
                You can view this ticket, but only members of the {ticket.department_name} department
                can take action on it.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
