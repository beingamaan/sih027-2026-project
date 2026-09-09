import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, RailwayRole } from '../context/AuthContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RailwayRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { activeRole, currentProfile, showToast } = useAuth();

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    showToast("Access Denied: Your active role cannot view this workspace.", 'warning');
    return <Navigate to={currentProfile.landingRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
