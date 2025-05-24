import { db, storage } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageReference } from 'firebase/storage';
import { SharedProject } from '../types';

export interface SharedProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  lastModified: Date;
  status: 'draft' | 'in_review' | 'approved' | 'completed';
  sharedWith: {
    userId: string;
    userName: string;
    role: 'viewer' | 'editor' | 'reviewer';
    status: 'pending' | 'accepted';
  }[];
  files: {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
    version: number;
    url: string;
  }[];
}

class ProjectSharingService {
  private static instance: ProjectSharingService;
  private projectsCollection = 'shared_projects';
  private filesCollection = 'project_files';

  private constructor() {}

  public static getInstance(): ProjectSharingService {
    if (!ProjectSharingService.instance) {
      ProjectSharingService.instance = new ProjectSharingService();
    }
    return ProjectSharingService.instance;
  }

  async createProject(project: Omit<SharedProject, 'id' | 'createdAt' | 'lastModified'>): Promise<SharedProject> {
    try {
      const projectData = {
        ...project,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.projectsCollection), projectData);
      const doc = await getDoc(docRef);

      return {
        id: docRef.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate(),
        lastModified: doc.data()?.lastModified?.toDate(),
      } as SharedProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  public async getProject(projectId: string): Promise<SharedProject | null> {
    const projectRef = doc(db, this.projectsCollection, projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return null;
    }

    const data = projectSnap.data();
    return {
      id: projectSnap.id,
      name: data.name,
      description: data.description,
      status: data.status,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      lastModified: data.lastModified.toDate(),
      sharedWith: data.sharedWith || [],
      files: data.files || [],
    };
  }

  async getUserProjects(userId: string): Promise<SharedProject[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('ownerId', '==', userId),
        orderBy('lastModified', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate(),
        lastModified: doc.data()?.lastModified?.toDate(),
      })) as SharedProject[];
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  async getSharedProjects(userId: string): Promise<SharedProject[]> {
    try {
      const q = query(
        collection(db, this.projectsCollection),
        where('sharedWith', 'array-contains', { userId }),
        orderBy('lastModified', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate(),
        lastModified: doc.data()?.lastModified?.toDate(),
      })) as SharedProject[];
    } catch (error) {
      console.error('Error getting shared projects:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<SharedProject>): Promise<void> {
    try {
      const docRef = doc(db, this.projectsCollection, projectId);
      await updateDoc(docRef, {
        ...updates,
        lastModified: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) return;

      // Delete associated files from storage
      for (const file of project.files) {
        const fileRef = ref(storage, `projects/${projectId}/${file.id}`);
        await deleteObject(fileRef);
      }

      // Delete project document
      const docRef = doc(db, this.projectsCollection, projectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async shareProject(projectId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'reviewer'): Promise<void> {
    try {
      const docRef = doc(db, this.projectsCollection, projectId);
      const project = await this.getProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      const sharedWith = project.sharedWith || [];
      const existingShare = sharedWith.find(share => share.userId === userId);

      if (existingShare) {
        // Update existing share
        const updatedSharedWith = sharedWith.map(share =>
          share.userId === userId ? { ...share, role, status: 'pending' } : share
        );
        await updateDoc(docRef, { sharedWith: updatedSharedWith });
      } else {
        // Add new share
        const newShare = {
          userId,
          userName,
          role,
          status: 'pending',
        };
        await updateDoc(docRef, {
          sharedWith: [...sharedWith, newShare],
        });
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      throw error;
    }
  }

  async uploadFile(projectId: string, file: File, uploadedBy: string): Promise<SharedProject['files'][0]> {
    try {
      const fileId = `${Date.now()}_${file.name}`;
      const fileRef: StorageReference = ref(storage, `projects/${projectId}/${fileId}`);
      
      // Upload file to Firebase Storage
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      // Create file metadata
      const fileData = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedBy,
        uploadedAt: serverTimestamp(),
        version: 1,
        url,
      };

      // Add file to project
      const docRef = doc(db, this.projectsCollection, projectId);
      const project = await this.getProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      const files = project.files || [];
      await updateDoc(docRef, {
        files: [...files, fileData],
        lastModified: serverTimestamp(),
      });

      return {
        ...fileData,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Delete file from storage
      const fileRef = ref(storage, `projects/${projectId}/${fileId}`);
      await deleteObject(fileRef);

      // Remove file from project
      const docRef = doc(db, this.projectsCollection, projectId);
      const files = project.files.filter(file => file.id !== fileId);
      
      await updateDoc(docRef, {
        files,
        lastModified: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

export const projectSharingService = ProjectSharingService.getInstance();
export default ProjectSharingService; 