export interface ServiceInfo {
  acronym: string;
  swaggerPath: string;
  relativePath: string;
}

export interface SyncResult {
  service: string;
  success: boolean;
  error?: string;
}

export interface SyncOptions {
  force?: boolean;
  onProgress?: (service: string, status: string) => void;
}
