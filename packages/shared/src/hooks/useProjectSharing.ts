import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import ProjectSharingService, { SharedProject } from '../services/ProjectSharingService';

export const useProjectSharing = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectSharingService = ProjectSharingService.getInstance();

  const createProject = useCallback(async (project: Omit<SharedProject, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!currentUser) {
      setError('User must be authenticated to create projects');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newProject = await projectSharingService.createProject({
        ...project,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || 'Unknown User',
      });
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getProject = useCallback(async (projectId: string): Promise<SharedProject | null> => {
    try {
      setLoading(true);
      setError(null);
      return await projectSharingService.getProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get project');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserProjects = useCallback(async () => {
    if (!currentUser) {
      setError('User must be authenticated to get projects');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const projects = await projectSharingService.getUserProjects(currentUser.uid);
      return projects;
    } catch (err) {
      console.error('Error getting user projects:', err);
      setError('Failed to get user projects');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getSharedProjects = useCallback(async () => {
    if (!currentUser) {
      setError('User must be authenticated to get shared projects');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const projects = await projectSharingService.getSharedProjects(currentUser.uid);
      return projects;
    } catch (err) {
      console.error('Error getting shared projects:', err);
      setError('Failed to get shared projects');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<SharedProject>) => {
    setLoading(true);
    setError(null);

    try {
      await projectSharingService.updateProject(projectId, updates);
      return true;
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);

    try {
      await projectSharingService.deleteProject(projectId);
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const shareProject = useCallback(async (
    projectId: string,
    userId: string,
    userName: string,
    role: 'viewer' | 'editor' | 'reviewer'
  ) => {
    setLoading(true);
    setError(null);

    try {
      await projectSharingService.shareProject(projectId, userId, userName, role);
      return true;
    } catch (err) {
      console.error('Error sharing project:', err);
      setError('Failed to share project');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (projectId: string, file: File) => {
    if (!currentUser) {
      setError('User must be authenticated to upload files');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedFile = await projectSharingService.uploadFile(
        projectId,
        file,
        currentUser.displayName || 'Unknown User'
      );
      return uploadedFile;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteFile = useCallback(async (projectId: string, fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      await projectSharingService.deleteFile(projectId, fileId);
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createProject,
    getProject,
    getUserProjects,
    getSharedProjects,
    updateProject,
    deleteProject,
    shareProject,
    uploadFile,
    deleteFile,
  };
}; 