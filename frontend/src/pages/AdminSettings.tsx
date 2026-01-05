import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { departmentsApi } from '../api/departments';
import type { User, Department, CreateUserRequest } from '../types';
import { EmailStats } from '../components/EmailStats';
import './AdminSettings.css';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'email'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', department_id: null as number | null });
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    is_admin: false,
    department_id: null,
  });

  const [newDeptName, setNewDeptName] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        usersApi.getAll(),
        departmentsApi.getAll(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await usersApi.create(newUser);
      alert('User created successfully!');
      setShowUserForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        is_admin: false,
        department_id: null,
      });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    setIsLoading(true);
    try {
      await usersApi.deactivate(userId);
      alert('User deactivated successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to activate this user?')) return;

    setIsLoading(true);
    try {
      await usersApi.activate(userId);
      alert('User activated successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to activate user');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      name: user.name,
      email: user.email,
      department_id: user.departmentId,
    });
    setError('');
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError('');
    try {
      await usersApi.update(selectedUser.id, editedUser);
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setError('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError('');
    try {
      await usersApi.changePassword(selectedUser.id, newPassword);
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userEmail}"? This action cannot be undone.`)) return;

    setIsLoading(true);
    try {
      await usersApi.delete(userId);
      alert('User deleted successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await departmentsApi.create(newDeptName);
      alert('Department created successfully!');
      setShowDeptForm(false);
      setNewDeptName('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create department');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-box">
        <div className="page-header">
          <h1>Admin Settings</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Tickets
          </button>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'users' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'departments' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('departments')}
          >
            Departments
          </button>
          <button
            className={activeTab === 'email' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('email')}
          >
            Email Setup
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>User Management</h2>
              <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary">
                {showUserForm ? 'Cancel' : '+ Add User'}
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="create-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newUser.department_id || ''}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          department_id: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">None</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newUser.is_admin}
                      onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                    />
                    Admin User
                  </label>
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  Create User
                </button>
              </form>
            )}

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.departmentName || 'None'}</td>
                      <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => openEditModal(user)}
                            className="btn-edit-small"
                            disabled={isLoading}
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="btn-secondary-small"
                            disabled={isLoading}
                            title="Change password"
                          >
                            Password
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="btn-warning-small"
                              disabled={isLoading}
                              title="Deactivate user"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="btn-success-small"
                              disabled={isLoading}
                              title="Activate user"
                            >
                              Activate
                            </button>
                          )}
                          {user.email !== 'admin@system.com' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="btn-danger-small"
                              disabled={isLoading}
                              title="Delete user"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Department Management</h2>
              <button onClick={() => setShowDeptForm(!showDeptForm)} className="btn-primary">
                {showDeptForm ? 'Cancel' : '+ Add Department'}
              </button>
            </div>

            {showDeptForm && (
              <form onSubmit={handleCreateDepartment} className="create-form">
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  Create Department
                </button>
              </form>
            )}

            <div className="departments-grid">
              {departments.map((dept) => (
                <div key={dept.id} className="department-card">
                  <h3>{dept.name}</h3>
                  <p>Created: {new Date(dept.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Email Configuration</h2>
            </div>

            <EmailStats />

            <div className="email-setup-guide">
              <div className="guide-section">
                <h3>Google Workspace / Gmail SMTP Setup</h3>
                <p>To enable email notifications, you need to configure your Google account's App Password.</p>

                <div className="step-card">
                  <h4>Step 1: Enable 2-Factor Authentication</h4>
                  <ol>
                    <li>Go to your Google Account: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">myaccount.google.com/security</a></li>
                    <li>Under "How you sign in to Google", select "2-Step Verification"</li>
                    <li>Follow the steps to enable 2-Step Verification</li>
                  </ol>
                </div>

                <div className="step-card">
                  <h4>Step 2: Generate App Password</h4>
                  <ol>
                    <li>Go to App Passwords: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords</a></li>
                    <li>Select "Mail" and your device</li>
                    <li>Click "Generate"</li>
                    <li>Copy the 16-character password (it will look like: "xxxx xxxx xxxx xxxx")</li>
                  </ol>
                </div>

                <div className="step-card">
                  <h4>Step 3: Update Server Configuration</h4>
                  <p>Update the <code>.env</code> file on your server with the following settings:</p>

                  <div className="code-block">
                    <pre>{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your-email@gmail.com`}</pre>
                  </div>

                  <p className="warning-text">
                    <strong>Important:</strong> Remove all spaces from the app password before adding it to the .env file.
                  </p>
                </div>

                <div className="step-card">
                  <h4>Step 4: Restart the Backend Service</h4>
                  <p>After updating the .env file, restart the backend service:</p>
                  <div className="code-block">
                    <pre>docker-compose restart backend</pre>
                  </div>
                </div>

                <div className="info-box">
                  <h4>Email Notifications Will Be Sent For:</h4>
                  <ul>
                    <li>New ticket assigned to a department (sent to all department members)</li>
                    <li>Ticket reassigned to another department (sent to all new department members)</li>
                    <li>Ticket closed (sent to ticket creator)</li>
                    <li>Ticket overdue (sent to all users in the system)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit User: {selectedUser.name}</h3>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleEditUser}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={editedUser.department_id || ''}
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        department_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">None</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Change Password: {selectedUser.name}</h3>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
