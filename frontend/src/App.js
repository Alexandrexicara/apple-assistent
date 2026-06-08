import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RecoveryFlow from './pages/RecoveryFlow';
import Tickets from './pages/Tickets';
import AdminPanel from './pages/AdminPanel';
import AdminPayments from './pages/AdminPayments';
import Payment from './pages/Payment';
import NotFound from './pages/NotFound';

// Technician Pages
import TechnicianDashboard from './pages/TechnicianDashboard';
import ClientManager from './pages/ClientManager';
import DeviceRegistration from './pages/DeviceRegistration';
import ResetWithPassword from './pages/ResetWithPassword';
import ServiceOrder from './pages/ServiceOrder';
import Reports from './pages/Reports';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import TechnicianRoute from './components/TechnicianRoute';

// Styles
import './styles/globals.css';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/payment" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/recovery" element={
                <ProtectedRoute>
                  <RecoveryFlow />
                </ProtectedRoute>
              } />
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } />
              <Route path="/admin/payments" element={
                <AdminRoute>
                  <AdminPayments />
                </AdminRoute>
              } />
              
              {/* Technician Routes */}
              <Route path="/technician" element={
                <TechnicianRoute>
                  <TechnicianDashboard />
                </TechnicianRoute>
              } />
              <Route path="/technician/clients" element={
                <TechnicianRoute>
                  <ClientManager />
                </TechnicianRoute>
              } />
              <Route path="/technician/devices" element={
                <TechnicianRoute>
                  <DeviceRegistration />
                </TechnicianRoute>
              } />
              <Route path="/technician/reset" element={
                <TechnicianRoute>
                  <ResetWithPassword />
                </TechnicianRoute>
              } />
              <Route path="/technician/orders" element={
                <TechnicianRoute>
                  <ServiceOrder />
                </TechnicianRoute>
              } />
              <Route path="/technician/reports" element={
                <TechnicianRoute>
                  <Reports />
                </TechnicianRoute>
              } />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1c1c1e',
                color: '#fff',
                border: '1px solid #48484a',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
