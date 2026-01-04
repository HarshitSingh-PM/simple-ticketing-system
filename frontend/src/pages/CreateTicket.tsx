import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { departmentsApi } from '../api/departments';
import type { Department } from '../types';
import './CreateTicket.css';

const CreateTicket: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [carBought, setCarBought] = useState('');
  const [descriptionImage, setDescriptionImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
    setDefaultDeadline();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const setDefaultDeadline = () => {
    const defaultDeadline = new Date();
    defaultDeadline.setHours(defaultDeadline.getHours() + 24);
    const formatted = defaultDeadline.toISOString().slice(0, 16);
    setDeadline(formatted);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Only JPEG, PNG, and GIF images are allowed');
        return;
      }

      setDescriptionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setDescriptionImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !departmentId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const newTicket = await ticketsApi.create({
        title,
        description,
        description_image: descriptionImage || undefined,
        assigned_department_id: Number(departmentId),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        customer_name: customerName || undefined,
        customer_mobile: customerMobile || undefined,
        car_bought: carBought || undefined,
      });

      alert('Ticket created successfully!');
      navigate(`/tickets/${newTicket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-ticket-container">
      <div className="create-ticket-box">
        <div className="page-header">
          <h1>Create New Ticket</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to List
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="descriptionImage">Description Image (Optional)</label>
            <input
              type="file"
              id="descriptionImage"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleImageSelect}
              disabled={isLoading}
            />
            <small style={{ color: '#6c757d', marginTop: '0.25rem', display: 'block' }}>
              Max file size: 5MB. Allowed formats: JPEG, PNG, GIF
            </small>
            {imagePreview && (
              <div style={{ marginTop: '1rem', position: 'relative', maxWidth: '300px' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', borderRadius: '4px', border: '1px solid #dee2e6' }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '24px',
                    height: '24px',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerMobile">Customer Mobile Number</label>
            <input
              type="tel"
              id="customerMobile"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="carBought">Car Bought</label>
            <input
              type="text"
              id="carBought"
              value={carBought}
              onChange={(e) => setCarBought(e.target.value)}
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Assigned Department *</label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              required
              disabled={isLoading}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              type="datetime-local"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isLoading}
            />
            <small>Default: 24 hours from now</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
