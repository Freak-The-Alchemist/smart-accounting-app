import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserRole, UserRole } from '@smart-accounting/shared/hooks/useUserRole';
import { CircularProgress, Box } from '@mui/material';
import styles from './RoleRoute.module.css';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <Box className={styles.loading}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
} 