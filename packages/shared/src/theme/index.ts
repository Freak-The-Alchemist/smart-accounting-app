import { createTheme, Theme } from '@mui/material/styles';
import { Theme as RNTheme } from '@react-navigation/native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CustomTheme extends Theme {
  custom: {
    borderRadius: {
      small: string;
      medium: string;
      large: string;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
}

export interface CustomRNTheme extends RNTheme {
  custom: {
    borderRadius: {
      small: number;
      medium: number;
      large: number;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
}

const baseTheme = {
  custom: {
    borderRadius: {
      small: '4px',
      medium: '8px',
      large: '16px',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.custom.borderRadius.medium,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.custom.borderRadius.large,
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.custom.borderRadius.medium,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.custom.borderRadius.large,
        },
      },
    },
  },
});

export const reactNativeLightTheme: CustomRNTheme = {
  dark: false,
  colors: {
    primary: '#1976d2',
    background: '#f5f5f5',
    card: '#ffffff',
    text: 'rgba(0, 0, 0, 0.87)',
    border: 'rgba(0, 0, 0, 0.12)',
    notification: '#f50057',
  },
  custom: {
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
};

export const reactNativeDarkTheme: CustomRNTheme = {
  dark: true,
  colors: {
    primary: '#90caf9',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.12)',
    notification: '#f50057',
  },
  custom: {
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
}; 