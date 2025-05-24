import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useCompliance } from '@smart-accounting/shared/hooks/useCompliance';
import { Plugin, PluginInstance } from '@smart-accounting/shared/services/PluginService';
import { ComplianceReport } from '@smart-accounting/shared/services/ComplianceService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`compliance-tabpanel-${index}`}
      aria-labelledby={`compliance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ComplianceManagerProps {
  contextId: string;
  contextType: 'project' | 'organization';
}

export const ComplianceManager: React.FC<ComplianceManagerProps> = ({
  contextId,
  contextType,
}) => {
  const {
    loading,
    error,
    plugins,
    reports,
    loadPlugins,
    installPlugin,
    togglePlugin,
    updatePluginConfig,
    generateReport,
    exportReport,
  } = useCompliance(contextId, contextType);

  const [tabValue, setTabValue] = useState(0);
  const [showPluginDialog, setShowPluginDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInstance | null>(null);
  const [reportType, setReportType] = useState<'audit' | 'compliance' | 'tax'>('audit');
  const [reportPeriod, setReportPeriod] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInstallPlugin = async (pluginId: string) => {
    await installPlugin(pluginId);
    setShowPluginDialog(false);
  };

  const handleTogglePlugin = async (pluginId: string, isEnabled: boolean) => {
    await togglePlugin(pluginId, isEnabled);
  };

  const handleUpdateConfig = async (pluginId: string, config: Record<string, any>) => {
    await updatePluginConfig(pluginId, config);
    setShowConfigDialog(false);
  };

  const handleGenerateReport = async () => {
    const report = await generateReport(reportType, reportPeriod);
    if (report) {
      setShowReportDialog(false);
    }
  };

  const handleExportReport = async (report: ComplianceReport, format: 'pdf' | 'excel' | 'csv') => {
    const blob = await exportReport(report, format);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.type}-report-${report.id}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Plugins" />
        <Tab label="Reports" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Installed Plugins</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowPluginDialog(true)}
          >
            Install Plugin
          </Button>
        </Box>

        <List>
          {plugins.map((plugin) => (
            <ListItem key={plugin.id}>
              <ListItemText
                primary={plugin.pluginId}
                secondary={`Context: ${plugin.contextType}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedPlugin(plugin);
                    setShowConfigDialog(true);
                  }}
                >
                  <SettingsIcon />
                </IconButton>
                <Switch
                  edge="end"
                  checked={plugin.isEnabled}
                  onChange={(e) => handleTogglePlugin(plugin.pluginId, e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Compliance Reports</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowReportDialog(true)}
          >
            Generate Report
          </Button>
        </Box>

        <List>
          {reports.map((report) => (
            <ListItem key={report.id}>
              <ListItemText
                primary={`${report.type} Report`}
                secondary={`Generated: ${report.generatedAt.toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleExportReport(report, 'pdf')}
                  title="Export as PDF"
                >
                  <DownloadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Install Plugin Dialog */}
      <Dialog open={showPluginDialog} onClose={() => setShowPluginDialog(false)}>
        <DialogTitle>Install Plugin</DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={() => handleInstallPlugin('tax-calculator')}>
              <ListItemText
                primary="Tax Calculator"
                secondary="Calculate taxes based on different jurisdictions"
              />
            </ListItem>
            <ListItem button onClick={() => handleInstallPlugin('m-pesa-integration')}>
              <ListItemText
                primary="M-Pesa Integration"
                secondary="Integrate with M-Pesa payment system"
              />
            </ListItem>
            <ListItem button onClick={() => handleInstallPlugin('compliance-reporter')}>
              <ListItemText
                primary="Compliance Reporter"
                secondary="Generate compliance reports and audit trails"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPluginDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)}>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value as any)}
                >
                  <MenuItem value="audit">Audit Report</MenuItem>
                  <MenuItem value="compliance">Compliance Report</MenuItem>
                  <MenuItem value="tax">Tax Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={reportPeriod.start}
                  onChange={(date) => date && setReportPeriod({ ...reportPeriod, start: date })}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={reportPeriod.end}
                  onChange={(date) => date && setReportPeriod({ ...reportPeriod, end: date })}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button onClick={handleGenerateReport} variant="contained">
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plugin Config Dialog */}
      <Dialog open={showConfigDialog} onClose={() => setShowConfigDialog(false)}>
        <DialogTitle>Plugin Configuration</DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(selectedPlugin.config).map(([key, value]) => (
                <Grid item xs={12} key={key}>
                  <TextField
                    label={key}
                    value={value}
                    onChange={(e) =>
                      handleUpdateConfig(selectedPlugin.pluginId, {
                        [key]: e.target.value,
                      })
                    }
                    fullWidth
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 