import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { LoadingSkeleton } from './LoadingSkeleton';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallbackPath = '/unauthorized'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleHierarchy: Record<UserRole, number> = {
    'admin': 3,
    'accountant': 2,
    'attendant': 1
  };

  const hasPermission = roleHierarchy[user.role] >= roleHierarchy[requiredRole];

  if (!hasPermission) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 