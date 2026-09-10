import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, RailwayRole } from '../context/AuthContext';
import { Forbidden403 } from '../pages/Forbidden403';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RailwayRole[];
  requiredCapability?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredCapability
}) => {
  const location = useLocation();
  const { isAuthenticated, activeRole, hasCapability } = useAuth();

  // 1. If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If capability specified, check if user has the capability
  if (requiredCapability && !hasCapability(requiredCapability)) {
    // Check if user's role is allowed as fallback
    if (!allowedRoles || !allowedRoles.includes(activeRole)) {
      return (
        <Forbidden403
          requiredCapability={requiredCapability}
          attemptedPath={location.pathname}
        />
      );
    }
  }

  // 3. If allowedRoles specified, check if user's activeRole is included
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return (
      <Forbidden403
        requiredRole={allowedRoles.join(' or ')}
        attemptedPath={location.pathname}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
