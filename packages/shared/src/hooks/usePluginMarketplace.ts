import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { pluginMarketplaceService } from '../services/PluginMarketplaceService';
import { Plugin, PluginReview, PluginAnalytics } from '../types';

export const usePluginMarketplace = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredPlugins, setFeaturedPlugins] = useState<Plugin[]>([]);
  const [searchResults, setSearchResults] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [pluginAnalytics, setPluginAnalytics] = useState<PluginAnalytics | null>(null);
  const [pluginReviews, setPluginReviews] = useState<PluginReview[]>([]);

  const loadFeaturedPlugins = useCallback(async (limit: number = 5) => {
    setLoading(true);
    setError(null);

    try {
      const plugins = await pluginMarketplaceService.getFeaturedPlugins(limit);
      setFeaturedPlugins(plugins);
    } catch (err) {
      console.error('Error loading featured plugins:', err);
      setError('Failed to load featured plugins');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPlugins = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const plugins = await pluginMarketplaceService.searchPlugins(query);
      setSearchResults(plugins);
    } catch (err) {
      console.error('Error searching plugins:', err);
      setError('Failed to search plugins');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPluginDetails = useCallback(async (pluginId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [analytics, reviews] = await Promise.all([
        pluginMarketplaceService.getPluginAnalytics(pluginId),
        pluginMarketplaceService.getPluginReviews(pluginId),
      ]);

      setPluginAnalytics(analytics);
      setPluginReviews(reviews);
    } catch (err) {
      console.error('Error loading plugin details:', err);
      setError('Failed to load plugin details');
    } finally {
      setLoading(false);
    }
  }, []);

  const addReview = useCallback(async (
    pluginId: string,
    rating: number,
    comment: string
  ) => {
    if (!currentUser) {
      setError('User must be authenticated to add reviews');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await pluginMarketplaceService.addPluginReview(
        pluginId,
        currentUser.uid,
        currentUser.displayName || 'Anonymous',
        rating,
        comment
      );

      // Reload plugin details
      await loadPluginDetails(pluginId);
    } catch (err) {
      console.error('Error adding review:', err);
      setError('Failed to add review');
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadPluginDetails]);

  const publishPlugin = useCallback(async (plugin: Plugin) => {
    if (!currentUser) {
      setError('User must be authenticated to publish plugins');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await pluginMarketplaceService.publishPlugin(plugin);
      // Reload featured plugins
      await loadFeaturedPlugins();
    } catch (err) {
      console.error('Error publishing plugin:', err);
      setError('Failed to publish plugin');
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadFeaturedPlugins]);

  return {
    loading,
    error,
    featuredPlugins,
    searchResults,
    selectedPlugin,
    pluginAnalytics,
    pluginReviews,
    loadFeaturedPlugins,
    searchPlugins,
    loadPluginDetails,
    addReview,
    publishPlugin,
  };
}; 