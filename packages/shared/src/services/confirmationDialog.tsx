import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

export class ConfirmationDialogService {
  private static instance: ConfirmationDialogService;
  private root: ReturnType<typeof createRoot> | null = null;

  private constructor() {}

  public static getInstance(): ConfirmationDialogService {
    if (!ConfirmationDialogService.instance) {
      ConfirmationDialogService.instance = new ConfirmationDialogService();
    }
    return ConfirmationDialogService.instance;
  }

  public showConfirmation(options: ConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      this.root = createRoot(container);

      const handleClose = (confirmed: boolean) => {
        if (this.root) {
          this.root.unmount();
          document.body.removeChild(container);
          this.root = null;
        }
        resolve(confirmed);
      };

      const ConfirmationDialog = () => (
        <Dialog
          open={true}
          onClose={() => handleClose(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{options.title}</DialogTitle>
          <DialogContent>
            <Typography>{options.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose(false)} color="primary">
              {options.cancelLabel || 'Cancel'}
            </Button>
            <Button
              onClick={() => handleClose(true)}
              color={options.severity === 'error' ? 'error' : 'primary'}
              variant="contained"
            >
              {options.confirmLabel || 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      );

      this.root.render(<ConfirmationDialog />);
    });
  }

  public async confirmDelete(itemName: string): Promise<boolean> {
    return this.showConfirmation({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${itemName}?`,
      severity: 'warning',
      confirmLabel: 'Delete'
    });
  }

  public async confirmTransaction(amount: number, type: string): Promise<boolean> {
    return this.showConfirmation({
      title: 'Confirm Transaction',
      message: `Are you sure you want to ${type} $${amount.toFixed(2)}?`,
      severity: 'info'
    });
  }

  public async confirmEdit(itemName: string): Promise<boolean> {
    return this.showConfirmation({
      title: 'Confirm Edit',
      message: `Are you sure you want to edit "${itemName}"?`,
      confirmLabel: 'Save Changes',
      cancelLabel: 'Cancel',
      severity: 'success'
    });
  }
} 