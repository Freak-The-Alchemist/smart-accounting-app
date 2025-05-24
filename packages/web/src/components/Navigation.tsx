import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box
} from '@mui/material';
import { AccountCircle, Logout, History, Security } from '@mui/icons-material';
import { AuthService } from '@smart-accounting/shared';
import { AutoLogoutService } from '@smart-accounting/shared';

export const Navigation = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const auth = AuthService.getInstance();
  const autoLogout = AutoLogoutService.getInstance();

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      autoLogout.startAutoLogout(currentUser.role);
    }
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      autoLogout.stopAutoLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Smart Accounting
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
              {user.role === 'manager' && (
                <>
                  <MenuItem onClick={handleClose} sx={{ color: 'text.primary' }}>
                    <History sx={{ mr: 1 }} />
                    Audit Logs
                  </MenuItem>
                  <MenuItem onClick={handleClose} sx={{ color: 'text.primary' }}>
                    <Security sx={{ mr: 1 }} />
                    Security Alerts
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}; 