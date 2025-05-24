import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
} from '@mui/icons-material';
import { useFormArray } from '../hooks/useFormArray';
import { z } from 'zod';

interface FormArrayProps<T> {
  name: string;
  label?: string;
  initialValues: T[];
  validationSchema: z.ZodSchema<T>;
  onValidate?: (items: T[]) => Promise<{ isValid: boolean; errors?: z.ZodError }>;
  renderItem: (props: {
    item: T;
    index: number;
    error?: Record<string, string>;
    touched?: Record<string, boolean>;
    onChange: (name: string, value: any) => void;
    onBlur: (name: string) => void;
  }) => React.ReactNode;
  renderAddButton?: (props: { onClick: () => void }) => React.ReactNode;
  renderRemoveButton?: (props: { onClick: () => void }) => React.ReactNode;
  renderMoveButtons?: (props: {
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  }) => React.ReactNode;
  emptyMessage?: string;
  addButtonLabel?: string;
  removeButtonLabel?: string;
  moveUpButtonLabel?: string;
  moveDownButtonLabel?: string;
}

export function FormArray<T extends Record<string, any>>({
  name,
  label,
  initialValues,
  validationSchema,
  onValidate,
  renderItem,
  renderAddButton,
  renderRemoveButton,
  renderMoveButtons,
  emptyMessage = 'No items',
  addButtonLabel = 'Add Item',
  removeButtonLabel = 'Remove Item',
  moveUpButtonLabel = 'Move Up',
  moveDownButtonLabel = 'Move Down',
}: FormArrayProps<T>) {
  const {
    items,
    errors,
    touched,
    handleItemChange,
    handleItemBlur,
    addItem,
    removeItem,
    moveItem,
  } = useFormArray({
    initialValues,
    validationSchema,
    onValidate,
  });

  const handleAdd = () => {
    addItem({} as T);
  };

  const handleRemove = (index: number) => {
    removeItem(index);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < items.length - 1) {
      moveItem(index, index + 1);
    }
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle1" gutterBottom>
          {label}
        </Typography>
      )}

      {items.length === 0 ? (
        <Typography color="textSecondary" align="center">
          {emptyMessage}
        </Typography>
      ) : (
        items.map((item, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              {renderMoveButtons ? (
                renderMoveButtons({
                  onMoveUp: () => handleMoveUp(index),
                  onMoveDown: () => handleMoveDown(index),
                  canMoveUp: index > 0,
                  canMoveDown: index < items.length - 1,
                })
              ) : (
                <>
                  <Tooltip title={moveUpButtonLabel}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUpIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={moveDownButtonLabel}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                      >
                        <MoveDownIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}

              {renderRemoveButton ? (
                renderRemoveButton({
                  onClick: () => handleRemove(index),
                })
              ) : (
                <Tooltip title={removeButtonLabel}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {renderItem({
              item,
              index,
              error: errors[index],
              touched: touched[index],
              onChange: (name, value) => handleItemChange(index, name, value),
              onBlur: (name) => handleItemBlur(index, name),
            })}
          </Paper>
        ))
      )}

      {renderAddButton ? (
        renderAddButton({ onClick: handleAdd })
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={addButtonLabel}>
            <IconButton
              color="primary"
              onClick={handleAdd}
              size="large"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
} 