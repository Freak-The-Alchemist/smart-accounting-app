import React from 'react';
import {
  TextField,
  TextFieldProps,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  SelectProps,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
} from '@mui/material';

interface BaseFieldProps {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helperText?: string;
}

interface TextFieldComponentProps extends BaseFieldProps, Omit<TextFieldProps, 'name' | 'label' | 'error'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  multiline?: boolean;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps, Omit<SelectProps, 'name' | 'label' | 'error'> {
  options: Array<{ value: string | number; label: string }>;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

interface SwitchFieldProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

interface RadioFieldProps extends BaseFieldProps {
  options: Array<{ value: string | number; label: string }>;
  value?: string | number;
  onChange?: (value: string | number) => void;
}

type ValidatedFieldProps =
  | ({ type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' } & TextFieldComponentProps)
  | ({ type: 'select' } & SelectFieldProps)
  | ({ type: 'checkbox' } & CheckboxFieldProps)
  | ({ type: 'switch' } & SwitchFieldProps)
  | ({ type: 'radio' } & RadioFieldProps);

export const ValidatedField: React.FC<ValidatedFieldProps> = (props) => {
  const {
    name,
    label,
    error,
    touched,
    required,
    helperText,
    type = 'text',
    ...rest
  } = props;

  const showError = touched && error;
  const finalHelperText = showError ? error : helperText;

  switch (type) {
    case 'select': {
      const { options, ...selectProps } = rest as SelectFieldProps;
      return (
        <FormControl
          fullWidth
          error={showError}
          required={required}
          variant="outlined"
        >
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            name={name}
            {...selectProps}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {finalHelperText && (
            <FormHelperText>{finalHelperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    case 'checkbox': {
      const { checked, onChange, ...checkboxProps } = rest as CheckboxFieldProps;
      return (
        <FormControlLabel
          control={
            <Checkbox
              name={name}
              checked={checked}
              onChange={(e) => onChange?.(e.target.checked)}
              {...checkboxProps}
            />
          }
          label={label}
        />
      );
    }

    case 'switch': {
      const { checked, onChange, ...switchProps } = rest as SwitchFieldProps;
      return (
        <FormControlLabel
          control={
            <Switch
              name={name}
              checked={checked}
              onChange={(e) => onChange?.(e.target.checked)}
              {...switchProps}
            />
          }
          label={label}
        />
      );
    }

    case 'radio': {
      const { options, value, onChange, ...radioProps } = rest as RadioFieldProps;
      return (
        <FormControl component="fieldset" error={showError}>
          <FormLabel component="legend">{label}</FormLabel>
          <RadioGroup
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio {...radioProps} />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {finalHelperText && (
            <FormHelperText>{finalHelperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    default:
      return (
        <TextField
          fullWidth
          name={name}
          label={label}
          type={type}
          error={showError}
          helperText={finalHelperText}
          required={required}
          variant="outlined"
          {...(rest as TextFieldProps)}
        />
      );
  }
}; 