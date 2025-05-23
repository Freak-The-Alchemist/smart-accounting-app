import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Grid,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  AccessTime as AccessTimeIcon,
  Logout as LogoutIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
} from '@mui/icons-material';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import { useRealtimeSync } from '@smart-accounting/shared/hooks/useRealtimeSync';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { CollaborationPanel } from './CollaborationPanel';
import { CollaborationProvider } from '@smart-accounting/shared/contexts/CollaborationContext';

const drawerWidth = 240;

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isSyncing, lastSync, error } = useRealtimeSync();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Shifts', icon: <AccessTimeIcon />, path: '/shifts' },
    { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Smart Accounting
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <CollaborationProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Navigation />
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={9}>
              <Outlet />
            </Grid>
            <Grid item xs={12} md={3}>
              <CollaborationPanel />
            </Grid>
          </Grid>
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error?.message || 'An error occurred during synchronization'}
          </Alert>
        </Snackbar>

        {lastSync && (
          <Snackbar
            open={true}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Last synchronized: {lastSync.toLocaleTimeString()}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </CollaborationProvider>
  );
}; 