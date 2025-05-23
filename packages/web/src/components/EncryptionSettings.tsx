import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useSecurity } from '@shared/hooks/useSecurity';
import { useAuth } from '@shared/hooks/useAuth';

interface EncryptionKey {
  id: string;
  name: string;
  type: 'AES' | 'RSA' | 'TripleDES' | 'Blowfish';
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

const EncryptionSettings: React.FC = () => {
  const { user } = useAuth();
  const { generateEncryptionKey, encryptData, decryptData } = useSecurity();
  const [keys, setKeys] = useState<EncryptionKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'AES' | 'RSA' | 'TripleDES' | 'Blowfish'>('AES');
  const [testData, setTestData] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [autoEncryption, setAutoEncryption] = useState(true);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement key loading from backend
      const mockKeys: EncryptionKey[] = [
        {
          id: '1',
          name: 'Default AES Key',
          type: 'AES',
          createdAt: new Date(),
          lastUsed: new Date(),
          isActive: true,
        },
      ];
      setKeys(mockKeys);
    } catch (err) {
      setError('Failed to load encryption keys');
      console.error('Error loading encryption keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadKeys();
    }
  }, [user]);

  const handleCreateKey = async () => {
    try {
      const key = await generateEncryptionKey(newKeyType);
      const newKey: EncryptionKey = {
        id: Date.now().toString(),
        name: newKeyName,
        type: newKeyType,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true,
      };
      setKeys([...keys, newKey]);
      setNewKeyDialogOpen(false);
      setNewKeyName('');
      setSuccess('Encryption key created successfully');
    } catch (err) {
      setError('Failed to create encryption key');
      console.error('Error creating encryption key:', err);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      // TODO: Implement key deletion in backend
      setKeys(keys.filter((key) => key.id !== keyId));
      setSuccess('Encryption key deleted successfully');
    } catch (err) {
      setError('Failed to delete encryption key');
      console.error('Error deleting encryption key:', err);
    }
  };

  const handleTestEncryption = async () => {
    try {
      const activeKey = keys.find((key) => key.isActive);
      if (!activeKey) {
        setError('No active encryption key found');
        return;
      }

      const encrypted = await encryptData(testData, activeKey.id);
      setEncryptedData(encrypted);

      const decrypted = await decryptData(encrypted, activeKey.id);
      setDecryptedData(decrypted);

      setSuccess('Encryption test completed successfully');
    } catch (err) {
      setError('Failed to test encryption');
      console.error('Error testing encryption:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading encryption settings...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Encryption Settings
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setNewKeyDialogOpen(true)}
        >
          Create New Key
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Encryption Keys List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Encryption Keys
            </Typography>
            <List>
              {keys.map((key) => (
                <React.Fragment key={key.id}>
                  <ListItem>
                    <ListItemText
                      primary={key.name}
                      secondary={`Type: ${key.type} | Created: ${key.createdAt.toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={key.isActive}
                            onChange={() => {
                              setKeys(
                                keys.map((k) =>
                                  k.id === key.id ? { ...k, isActive: !k.isActive } : k
                                )
                              );
                            }}
                          />
                        }
                        label="Active"
                      />
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Encryption Test */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Test Encryption
            </Typography>
            <Box mb={2}>
              <TextField
                label="Test Data"
                multiline
                rows={4}
                fullWidth
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<SecurityIcon />}
              onClick={handleTestEncryption}
              disabled={!testData}
              fullWidth
            >
              Test Encryption
            </Button>
            {encryptedData && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Encrypted Data:
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  value={encryptedData}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            )}
            {decryptedData && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Decrypted Data:
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  value={decryptedData}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Global Settings */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Global Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoEncryption}
                  onChange={(e) => setAutoEncryption(e.target.checked)}
                />
              }
              label="Enable automatic encryption for sensitive data"
            />
          </Card>
        </Grid>
      </Grid>

      {/* Create New Key Dialog */}
      <Dialog open={newKeyDialogOpen} onClose={() => setNewKeyDialogOpen(false)}>
        <DialogTitle>Create New Encryption Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Key Type</InputLabel>
            <Select
              value={newKeyType}
              onChange={(e) => setNewKeyType(e.target.value as any)}
              label="Key Type"
            >
              <MenuItem value="AES">AES</MenuItem>
              <MenuItem value="RSA">RSA</MenuItem>
              <MenuItem value="TripleDES">Triple DES</MenuItem>
              <MenuItem value="Blowfish">Blowfish</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewKeyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateKey}
            variant="contained"
            disabled={!newKeyName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EncryptionSettings; 