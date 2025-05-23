import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useProjectSharing } from '@smart-accounting/shared/hooks/useProjectSharing';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import { SharedProject } from '@smart-accounting/shared/services/ProjectSharingService';
import { UserPresence } from './UserPresence';
import { CollaborationPanel } from './CollaborationPanel';
import { ComplianceManager } from './ComplianceManager';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectSharing: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    error,
    getUserProjects,
    getSharedProjects,
    createProject,
    updateProject,
    deleteProject,
    shareProject,
    uploadFile,
    deleteFile,
  } = useProjectSharing();

  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SharedProject | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor' | 'reviewer'>('viewer');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'draft' as const,
  });
  const [tabValue, setTabValue] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const [ownedProjects, sharedProjects] = await Promise.all([
      getUserProjects(),
      getSharedProjects(),
    ]);
    setProjects([...ownedProjects, ...sharedProjects]);
  };

  const handleCreateProject = async () => {
    const project = await createProject(newProject);
    if (project) {
      setProjects([project, ...projects]);
      setOpenCreateDialog(false);
      setNewProject({ name: '', description: '', status: 'draft' });
    }
  };

  const handleShare = (project: SharedProject) => {
    setSelectedProject(project);
    setOpenShareDialog(true);
  };

  const handleShareSubmit = async () => {
    if (!selectedProject || !shareEmail) return;

    const success = await shareProject(
      selectedProject.id,
      'temp-id', // TODO: Get actual user ID from email
      shareEmail,
      shareRole
    );

    if (success) {
      const updatedProject = await getProject(selectedProject.id);
      if (updatedProject) {
        setProjects(projects.map(p => 
          p.id === selectedProject.id ? updatedProject : p
        ));
      }
      setOpenShareDialog(false);
      setShareEmail('');
      setShareRole('viewer');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const success = await deleteProject(projectId);
      if (success) {
        setProjects(projects.filter(p => p.id !== projectId));
      }
    }
  };

  const handleFileUpload = async (projectId: string, file: File) => {
    const uploadedFile = await uploadFile(projectId, file);
    if (uploadedFile) {
      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        setProjects(projects.map(p => 
          p.id === projectId ? updatedProject : p
        ));
      }
    }
  };

  const handleFileDelete = async (projectId: string, fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      const success = await deleteFile(projectId, fileId);
      if (success) {
        const updatedProject = await getProject(projectId);
        if (updatedProject) {
          setProjects(projects.map(p => 
            p.id === projectId ? updatedProject : p
          ));
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'in_review': return 'warning';
      case 'approved': return 'success';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Shared Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="My Projects" />
        <Tab label="Shared with Me" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell>Shared With</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={project.status.replace('_', ' ')}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {project.lastModified.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {project.sharedWith.length} users
                  </TableCell>
                  <TableCell>
                    {project.files.length} files
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Share">
                      <IconButton onClick={() => handleShare(project)}>
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(project.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects
                .filter((project) =>
                  project.sharedWith.some((share) => share.userId === currentUser?.uid)
                )
                .map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.ownerName}</TableCell>
                    <TableCell>
                      {project.sharedWith.find((share) => share.userId === currentUser?.uid)?.role}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                        }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Share Dialog */}
      <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)}>
        <DialogTitle>Share Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Role"
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value as 'viewer' | 'editor' | 'reviewer')}
                fullWidth
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="reviewer">Reviewer</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareDialog(false)}>Cancel</Button>
          <Button onClick={handleShareSubmit} variant="contained" color="primary">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                multiline
                rows={4}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            color="primary"
            disabled={!newProject.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {selectedProject && (
        <>
          <UserPresence projectId={selectedProject.id} />
          <Box sx={{ mt: 2 }}>
            <CollaborationPanel targetId={selectedProject.id} targetType="project" />
          </Box>
          <Box sx={{ mt: 2 }}>
            <ComplianceManager contextId={selectedProject?.id || ''} contextType="project" />
          </Box>
        </>
      )}
    </Box>
  );
}; 