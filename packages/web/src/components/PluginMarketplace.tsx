import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { usePluginMarketplace } from '@smart-accounting/shared/hooks/usePluginMarketplace';
import { Plugin, PluginReview } from '@smart-accounting/shared/types';

export const PluginMarketplace: React.FC = () => {
  const {
    loading,
    error,
    featuredPlugins,
    searchResults,
    pluginAnalytics,
    pluginReviews,
    loadFeaturedPlugins,
    searchPlugins,
    loadPluginDetails,
    addReview,
  } = usePluginMarketplace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadFeaturedPlugins();
  }, [loadFeaturedPlugins]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    searchPlugins(searchQuery);
  };

  const handlePluginSelect = async (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    await loadPluginDetails(plugin.id);
  };

  const handleReviewSubmit = async () => {
    if (selectedPlugin) {
      await addReview(selectedPlugin.id, reviewRating, reviewComment);
      setReviewDialogOpen(false);
      setReviewRating(0);
      setReviewComment('');
    }
  };

  const renderPluginCard = (plugin: Plugin) => (
    <Card key={plugin.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {plugin.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {plugin.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={pluginAnalytics?.averageRating || 0} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({pluginAnalytics?.installs || 0} installs)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {plugin.permissions.map((permission) => (
            <Chip
              key={permission}
              label={permission}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handlePluginSelect(plugin)}
        >
          Install
        </Button>
        <Button
          size="small"
          startIcon={<ReviewIcon />}
          onClick={() => {
            setSelectedPlugin(plugin);
            setReviewDialogOpen(true);
          }}
        >
          Review
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Plugin Marketplace
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton type="submit">
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h5" gutterBottom>
            Featured Plugins
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {featuredPlugins.map(renderPluginCard)}
          </Grid>

          {searchResults.length > 0 && (
            <>
              <Typography variant="h5" gutterBottom>
                Search Results
              </Typography>
              <Grid container spacing={3}>
                {searchResults.map(renderPluginCard)}
              </Grid>
            </>
          )}
        </>
      )}

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Add Review</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Rating
              value={reviewRating}
              onChange={(_, value) => setReviewRating(value || 0)}
            />
            <TextField
              multiline
              rows={4}
              label="Your Review"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}; 