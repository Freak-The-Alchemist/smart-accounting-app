import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import { usePresence } from '@smart-accounting/shared/hooks/usePresence';
import { UserPresence as UserPresenceType } from '@smart-accounting/shared/services/PresenceService';

interface UserPresenceProps {
  projectId?: string;
  organizationId?: string;
}

const getStatusColor = (status: UserPresenceType['status']) => {
  switch (status) {
    case 'online':
      return 'success';
    case 'away':
      return 'warning';
    case 'offline':
      return 'error';
    default:
      return 'default';
  }
};

const formatLastSeen = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  return 'Just now';
};

export const UserPresence: React.FC<UserPresenceProps> = ({ projectId, organizationId }) => {
  const { presence, loading, error } = usePresence({ projectId, organizationId });

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading presence information...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">Error loading presence information</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Active Users
      </Typography>
      <List>
        {presence.map((user) => (
          <ListItem key={user.userId}>
            <ListItemAvatar>
              <Avatar>{user.userName[0].toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.userName}
              secondary={
                <Tooltip title={user.lastSeen ? formatLastSeen(user.lastSeen) : 'Unknown'}>
                  <span>Last seen: {user.lastSeen ? formatLastSeen(user.lastSeen) : 'Unknown'}</span>
                </Tooltip>
              }
            />
            <Chip
              label={user.status}
              color={getStatusColor(user.status)}
              size="small"
              sx={{ ml: 1 }}
            />
          </ListItem>
        ))}
        {presence.length === 0 && (
          <ListItem>
            <ListItemText primary="No active users" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}; 