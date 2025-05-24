declare module 'expo-file-system' {
  export const FileSystem: {
    documentDirectory: string;
    cacheDirectory: string;
    writeAsStringAsync(fileUri: string, contents: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
    readAsStringAsync(fileUri: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<string>;
    deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
    moveAsync(options: { from: string; to: string }): Promise<void>;
    copyAsync(options: { from: string; to: string }): Promise<void>;
    makeDirectoryAsync(fileUri: string, options?: { intermediates?: boolean }): Promise<void>;
    readDirectoryAsync(fileUri: string): Promise<string[]>;
    getInfoAsync(fileUri: string, options?: { size?: boolean }): Promise<FileInfo>;
  };

  export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
  }
}

declare module 'expo-sharing' {
  export const Sharing: {
    isAvailableAsync(): Promise<boolean>;
    shareAsync(fileUri: string, options?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>;
  };
} 