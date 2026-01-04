import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import TicketList from './pages/TicketList';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import AdminSettings from './pages/AdminSettings';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/change-password"
        element={
          user ? <ChangePassword /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TicketList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute>
            <CreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
