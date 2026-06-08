import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const TechnicianRoute = ({ children }) => {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Técnico ou Admin podem aceder
  if (user?.role !== 'technician' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default TechnicianRoute;
