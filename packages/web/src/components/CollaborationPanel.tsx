import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  TextField,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Drawer,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Comment as CommentIcon,
  CheckCircle as ApproveIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  FiberManualRecord as StatusIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Brush as BrushIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useCollaboration } from '@smart-accounting/shared/contexts/CollaborationContext';
import { formatDistanceToNow, format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import { Comment, WhiteboardElement } from '@smart-accounting/shared/services/CollaborationService';

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
      id={`collab-tabpanel-${index}`}
      aria-labelledby={`collab-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface CollaborationPanelProps {
  targetId: string;
  targetType: 'project' | 'file';
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ targetId, targetType }) => {
  const { user } = useAuth();
  const {
    activeUsers,
    sessionHistory,
    chatMessages,
    comments,
    conflictResolutions,
    activityMetrics,
    documentVersions,
    isCollaborating,
    leaveSession,
    sendChatMessage,
    resolveComment,
    resolveConflict,
    addComment,
    typingUsers,
    loading,
    error,
    updateComment,
    deleteComment,
    setTyping,
    whiteboardElements,
    joinSession,
    updateCursor,
    addReply,
    addWhiteboardElement,
    updateWhiteboardElement,
    deleteWhiteboardElement,
  } = useCollaboration(targetId, targetType);

  const [tabValue, setTabValue] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictResolution, setConflictResolution] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [visualizationType, setVisualizationType] = useState<'bar' | 'pie' | 'radar' | 'area'>('bar');
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'comments' | 'whiteboard'>('comments');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [whiteboardMode, setWhiteboardMode] = useState<'draw' | 'text' | 'select'>('select');
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [drawingWidth, setDrawingWidth] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    joinSession();
    return () => leaveSession();
  }, [joinSession, leaveSession]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (whiteboardMode !== 'draw') return;
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      lastPoint.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current || !lastPoint.current) return;
      const rect = canvas.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingWidth;
      ctx.stroke();

      lastPoint.current = currentPoint;
    };

    const handleMouseUp = () => {
      if (!isDrawing.current || !lastPoint.current) return;
      isDrawing.current = false;

      const drawingData = canvas.toDataURL();
      addWhiteboardElement('drawing', drawingData, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [whiteboardMode, drawingColor, drawingWidth, addWhiteboardElement]);

  if (!isCollaborating) {
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleResolveConflict = () => {
    if (conflictResolution.trim()) {
      resolveConflict(conflictResolution);
      setShowConflictDialog(false);
      setConflictResolution('');
    }
  };

  const getChangeIcon = (type: 'edit' | 'comment' | 'approve') => {
    switch (type) {
      case 'edit':
        return <EditIcon fontSize="small" />;
      case 'comment':
        return <CommentIcon fontSize="small" />;
      case 'approve':
        return <ApproveIcon fontSize="small" color="success" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: 'active' | 'idle' | 'away') => {
    switch (status) {
      case 'active':
        return 'success';
      case 'idle':
        return 'warning';
      case 'away':
        return 'error';
      default:
        return 'default';
    }
  };

  const prepareActivityData = () => {
    return activityMetrics.map(metric => ({
      name: metric.userName,
      edits: metric.edits,
      comments: metric.comments,
      approvals: metric.approvals,
      activeTime: metric.activeTime,
    }));
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    const data = prepareActivityData();
    let content: string | Uint8Array;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'xlsx':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Activity Report');
        content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        filename = 'activity-report.xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        content = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
        filename = 'activity-report.csv';
        mimeType = 'text/csv';
        break;
      case 'pdf':
        // PDF export would require additional library like jsPDF
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const renderVisualization = () => {
    const data = prepareActivityData();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    switch (visualizationType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="edits"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar
                name="Activity"
                dataKey="edits"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Area
                type="monotone"
                dataKey="edits"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="comments"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="edits" fill="#8884d8" name="Edits" />
              <Bar dataKey="comments" fill="#82ca9d" name="Comments" />
              <Bar dataKey="approvals" fill="#ffc658" name="Approvals" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderVersionComparison = () => {
    if (!selectedVersions) return null;

    const [v1, v2] = selectedVersions;
    const version1 = documentVersions.find(v => v.version === v1);
    const version2 = documentVersions.find(v => v.version === v2);

    if (!version1 || !version2) return null;

    return (
      <Dialog
        open={showVersionComparison}
        onClose={() => setShowVersionComparison(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Version Comparison</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Version {v1}</Typography>
              <Typography variant="caption">
                By {version1.userName} on {format(new Date(version1.timestamp), 'PPpp')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Version {v2}</Typography>
              <Typography variant="caption">
                By {version2.userName} on {format(new Date(version2.timestamp), 'PPpp')}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Changes in Version {v1}</Typography>
              {version1.changes.map((change, index) => (
                <Chip
                  key={index}
                  label={change.details}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Changes in Version {v2}</Typography>
              {version2.changes.map((change, index) => (
                <Chip
                  key={index}
                  label={change.details}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionComparison(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
    setTyping(e.target.value.length > 0);
  }, [setTyping]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    await addComment(newComment, { x: 0, y: 0 });
    setNewComment('');
    setTyping(false);
  }, [newComment, addComment, setTyping]);

  const handleEditComment = useCallback(async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    setEditingComment(commentId);
    setEditContent(comment.content);
    setMenuAnchor(null);
  }, [comments]);

  const handleUpdateComment = useCallback(async () => {
    if (!editingComment || !editContent.trim()) return;
    await updateComment(editingComment, { content: editContent });
    setEditingComment(null);
    setEditContent('');
  }, [editingComment, editContent, updateComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    await deleteComment(commentId);
    setMenuAnchor(null);
  }, [deleteComment]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, commentId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedComment(commentId);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedComment(null);
  }, []);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const renderComments = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      <List>
        {comments.map((comment) => (
          <React.Fragment key={comment.id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={comment.userName}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {comment.content}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {comment.replies.map((reply) => (
                        <Box key={reply.id} sx={{ ml: 4, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {reply.userName}: {reply.content}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                }
              />
              <IconButton
                size="small"
                onClick={() => setReplyTo(comment.id)}
              >
                <ReplyIcon />
              </IconButton>
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {replyTo && (
            <Button
              size="small"
              onClick={() => setReplyTo(null)}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => replyTo ? handleAddReply(replyTo) : handleSubmitComment()}
          >
            {replyTo ? 'Reply' : 'Comment'}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderWhiteboard = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Tooltip title="Select">
          <IconButton
            color={whiteboardMode === 'select' ? 'primary' : 'default'}
            onClick={() => setWhiteboardMode('select')}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Draw">
          <IconButton
            color={whiteboardMode === 'draw' ? 'primary' : 'default'}
            onClick={() => setWhiteboardMode('draw')}
          >
            <BrushIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Text">
          <IconButton
            color={whiteboardMode === 'text' ? 'primary' : 'default'}
            onClick={() => setWhiteboardMode('text')}
          >
            <CommentIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#fff',
        }}
      />
    </Box>
  );

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading collaboration data...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">Error loading collaboration data</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', p: 1 }}>
          <Button
            variant={selectedTab === 'comments' ? 'contained' : 'text'}
            onClick={() => setSelectedTab('comments')}
            sx={{ mr: 1 }}
          >
            Comments
          </Button>
          <Button
            variant={selectedTab === 'whiteboard' ? 'contained' : 'text'}
            onClick={() => setSelectedTab('whiteboard')}
          >
            Whiteboard
          </Button>
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {selectedTab === 'comments' ? renderComments() : renderWhiteboard()}
      </Box>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active Users
          </Typography>
          <List>
            {activeUsers.map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.userName}
                  secondary={user.cursor ? 'Editing...' : 'Viewing'}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Paper>
  );
}; 