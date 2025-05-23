import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { Plugin, PluginInstance } from '../types';

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface PluginAnalytics {
  pluginId: string;
  installs: number;
  activeInstances: number;
  averageRating: number;
  lastUpdated: Date;
}

class PluginMarketplaceService {
  private static instance: PluginMarketplaceService;
  private pluginsCollection = 'marketplace_plugins';
  private reviewsCollection = 'plugin_reviews';
  private analyticsCollection = 'plugin_analytics';

  private constructor() {}

  public static getInstance(): PluginMarketplaceService {
    if (!PluginMarketplaceService.instance) {
      PluginMarketplaceService.instance = new PluginMarketplaceService();
    }
    return PluginMarketplaceService.instance;
  }

  public async publishPlugin(plugin: Plugin): Promise<void> {
    const pluginRef = doc(db, this.pluginsCollection, plugin.id);
    await updateDoc(pluginRef, {
      ...plugin,
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Initialize analytics
    await this.initializePluginAnalytics(plugin.id);
  }

  public async getFeaturedPlugins(limit: number = 5): Promise<Plugin[]> {
    const q = query(
      collection(db, this.pluginsCollection),
      where('status', '==', 'published'),
      orderBy('installs', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Plugin[];
  }

  public async searchPlugins(query: string): Promise<Plugin[]> {
    const pluginsRef = collection(db, this.pluginsCollection);
    const q = query(
      pluginsRef,
      where('status', '==', 'published'),
      where('name', '>=', query),
      where('name', '<=', query + '\uf8ff')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Plugin[];
  }

  public async getPluginAnalytics(pluginId: string): Promise<PluginAnalytics | null> {
    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    const analyticsSnap = await getDoc(analyticsRef);

    if (!analyticsSnap.exists()) {
      return null;
    }

    return {
      ...analyticsSnap.data(),
      lastUpdated: analyticsSnap.data().lastUpdated.toDate(),
    } as PluginAnalytics;
  }

  public async addPluginReview(
    pluginId: string,
    userId: string,
    userName: string,
    rating: number,
    comment: string
  ): Promise<void> {
    const review: Omit<PluginReview, 'id'> = {
      pluginId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date(),
    };

    await addDoc(collection(db, this.reviewsCollection), {
      ...review,
      createdAt: serverTimestamp(),
    });

    // Update plugin analytics
    await this.updatePluginAnalytics(pluginId);
  }

  public async getPluginReviews(pluginId: string): Promise<PluginReview[]> {
    const q = query(
      collection(db, this.reviewsCollection),
      where('pluginId', '==', pluginId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as PluginReview[];
  }

  private async initializePluginAnalytics(pluginId: string): Promise<void> {
    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    await updateDoc(analyticsRef, {
      pluginId,
      installs: 0,
      activeInstances: 0,
      averageRating: 0,
      lastUpdated: serverTimestamp(),
    });
  }

  private async updatePluginAnalytics(pluginId: string): Promise<void> {
    const reviews = await this.getPluginReviews(pluginId);
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    await updateDoc(analyticsRef, {
      averageRating,
      lastUpdated: serverTimestamp(),
    });
  }

  public async trackPluginInstall(pluginId: string): Promise<void> {
    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    const analyticsSnap = await getDoc(analyticsRef);

    if (analyticsSnap.exists()) {
      const currentInstalls = analyticsSnap.data().installs || 0;
      await updateDoc(analyticsRef, {
        installs: currentInstalls + 1,
        lastUpdated: serverTimestamp(),
      });
    }
  }

  public async trackPluginUninstall(pluginId: string): Promise<void> {
    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    const analyticsSnap = await getDoc(analyticsRef);

    if (analyticsSnap.exists()) {
      const currentInstalls = analyticsSnap.data().installs || 0;
      await updateDoc(analyticsRef, {
        installs: Math.max(0, currentInstalls - 1),
        lastUpdated: serverTimestamp(),
      });
    }
  }

  public async updateActiveInstances(pluginId: string, count: number): Promise<void> {
    const analyticsRef = doc(db, this.analyticsCollection, pluginId);
    await updateDoc(analyticsRef, {
      activeInstances: count,
      lastUpdated: serverTimestamp(),
    });
  }
}

export const pluginMarketplaceService = PluginMarketplaceService.getInstance(); 