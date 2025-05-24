import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  type: 'calculator' | 'integration' | 'report' | 'custom';
  config: Record<string, any>;
  isEnabled: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginInstance {
  id: string;
  pluginId: string;
  contextId: string; // project or organization ID
  contextType: 'project' | 'organization';
  config: Record<string, any>;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class PluginService {
  private static instance: PluginService;
  private plugins: Map<string, Plugin> = new Map();
  private pluginInstances: Map<string, PluginInstance> = new Map();

  private constructor() {
    this.initializeDefaultPlugins();
  }

  public static getInstance(): PluginService {
    if (!PluginService.instance) {
      PluginService.instance = new PluginService();
    }
    return PluginService.instance;
  }

  private async initializeDefaultPlugins() {
    const defaultPlugins: Plugin[] = [
      {
        id: 'tax-calculator',
        name: 'Tax Calculator',
        description: 'Calculate taxes based on different jurisdictions',
        version: '1.0.0',
        author: 'Smart Accounting',
        type: 'calculator',
        config: {
          jurisdictions: ['US', 'UK', 'EU'],
          taxRates: {},
        },
        isEnabled: true,
        permissions: ['read:tax', 'write:tax'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'm-pesa-integration',
        name: 'M-Pesa Integration',
        description: 'Integrate with M-Pesa payment system',
        version: '1.0.0',
        author: 'Smart Accounting',
        type: 'integration',
        config: {
          apiKey: '',
          environment: 'sandbox',
        },
        isEnabled: false,
        permissions: ['read:payments', 'write:payments'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'compliance-reporter',
        name: 'Compliance Reporter',
        description: 'Generate compliance reports and audit trails',
        version: '1.0.0',
        author: 'Smart Accounting',
        type: 'report',
        config: {
          reportTypes: ['audit', 'compliance', 'tax'],
          formats: ['pdf', 'excel', 'csv'],
        },
        isEnabled: true,
        permissions: ['read:reports', 'write:reports'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const plugin of defaultPlugins) {
      await this.registerPlugin(plugin);
    }
  }

  public async registerPlugin(plugin: Plugin): Promise<void> {
    const pluginRef = doc(db, 'plugins', plugin.id);
    await setDoc(pluginRef, {
      ...plugin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    this.plugins.set(plugin.id, plugin);
  }

  public async getPlugin(pluginId: string): Promise<Plugin | null> {
    if (this.plugins.has(pluginId)) {
      return this.plugins.get(pluginId)!;
    }

    const pluginRef = doc(db, 'plugins', pluginId);
    const pluginSnap = await getDoc(pluginRef);
    if (pluginSnap.exists()) {
      const plugin = pluginSnap.data() as Plugin;
      this.plugins.set(pluginId, plugin);
      return plugin;
    }
    return null;
  }

  public async getAllPlugins(): Promise<Plugin[]> {
    const pluginsRef = collection(db, 'plugins');
    const pluginsSnap = await getDocs(pluginsRef);
    const plugins: Plugin[] = [];
    pluginsSnap.forEach((doc) => {
      const plugin = doc.data() as Plugin;
      this.plugins.set(plugin.id, plugin);
      plugins.push(plugin);
    });
    return plugins;
  }

  public async installPlugin(
    pluginId: string,
    contextId: string,
    contextType: 'project' | 'organization',
    config: Record<string, any> = {}
  ): Promise<PluginInstance> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const instanceId = `${pluginId}-${contextId}`;
    const instance: PluginInstance = {
      id: instanceId,
      pluginId,
      contextId,
      contextType,
      config: { ...plugin.config, ...config },
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const instanceRef = doc(db, 'plugin_instances', instanceId);
    await setDoc(instanceRef, {
      ...instance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    this.pluginInstances.set(instanceId, instance);
    return instance;
  }

  public async getPluginInstance(
    pluginId: string,
    contextId: string
  ): Promise<PluginInstance | null> {
    const instanceId = `${pluginId}-${contextId}`;
    if (this.pluginInstances.has(instanceId)) {
      return this.pluginInstances.get(instanceId)!;
    }

    const instanceRef = doc(db, 'plugin_instances', instanceId);
    const instanceSnap = await getDoc(instanceRef);
    if (instanceSnap.exists()) {
      const instance = instanceSnap.data() as PluginInstance;
      this.pluginInstances.set(instanceId, instance);
      return instance;
    }
    return null;
  }

  public async updatePluginConfig(
    pluginId: string,
    contextId: string,
    config: Record<string, any>
  ): Promise<void> {
    const instance = await this.getPluginInstance(pluginId, contextId);
    if (!instance) {
      throw new Error(`Plugin instance not found for ${pluginId} in ${contextId}`);
    }

    const instanceRef = doc(db, 'plugin_instances', instance.id);
    await updateDoc(instanceRef, {
      config: { ...instance.config, ...config },
      updatedAt: serverTimestamp(),
    });

    instance.config = { ...instance.config, ...config };
    instance.updatedAt = new Date();
    this.pluginInstances.set(instance.id, instance);
  }

  public async togglePlugin(
    pluginId: string,
    contextId: string,
    isEnabled: boolean
  ): Promise<void> {
    const instance = await this.getPluginInstance(pluginId, contextId);
    if (!instance) {
      throw new Error(`Plugin instance not found for ${pluginId} in ${contextId}`);
    }

    const instanceRef = doc(db, 'plugin_instances', instance.id);
    await updateDoc(instanceRef, {
      isEnabled,
      updatedAt: serverTimestamp(),
    });

    instance.isEnabled = isEnabled;
    instance.updatedAt = new Date();
    this.pluginInstances.set(instance.id, instance);
  }

  public async getContextPlugins(
    contextId: string,
    contextType: 'project' | 'organization'
  ): Promise<PluginInstance[]> {
    const instancesRef = collection(db, 'plugin_instances');
    const q = query(
      instancesRef,
      where('contextId', '==', contextId),
      where('contextType', '==', contextType)
    );
    const instancesSnap = await getDocs(q);
    const instances: PluginInstance[] = [];
    instancesSnap.forEach((doc) => {
      const instance = doc.data() as PluginInstance;
      this.pluginInstances.set(instance.id, instance);
      instances.push(instance);
    });
    return instances;
  }
}

export const pluginService = PluginService.getInstance(); 