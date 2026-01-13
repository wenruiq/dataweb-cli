import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DatawebConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

// Use XDG config directory standard
const CONFIG_DIR = process.env.XDG_CONFIG_HOME
  ? join(process.env.XDG_CONFIG_HOME, 'dataweb')
  : join(homedir(), '.config', 'dataweb');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export async function getConfigPath(): Promise<string> {
  return CONFIG_FILE;
}

export async function configExists(): Promise<boolean> {
  const file = Bun.file(CONFIG_FILE);
  return await file.exists();
}

export async function loadConfig(): Promise<DatawebConfig | null> {
  try {
    const file = Bun.file(CONFIG_FILE);
    if (!(await file.exists())) {
      return null;
    }
    const config = (await file.json()) as DatawebConfig;
    return config;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

export async function saveConfig(config: DatawebConfig): Promise<void> {
  try {
    // Ensure config directory exists
    await Bun.$`mkdir -p ${CONFIG_DIR}`.quiet();

    // Write config file
    await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

export async function updateConfig(
  updates: Partial<DatawebConfig>,
): Promise<DatawebConfig> {
  const existingConfig = await loadConfig();
  const newConfig = {
    ...DEFAULT_CONFIG,
    ...existingConfig,
    ...updates,
  } as DatawebConfig;

  await saveConfig(newConfig);
  return newConfig;
}

export async function deleteConfig(): Promise<void> {
  try {
    await Bun.$`rm -f ${CONFIG_FILE}`.quiet();
  } catch (error) {
    console.error('Failed to delete config:', error);
  }
}

export function createDefaultConfig(): DatawebConfig {
  return DEFAULT_CONFIG as DatawebConfig;
}

export function validateConfig(config: DatawebConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.backend?.path) {
    errors.push('Backend path is required');
  }

  if (!config.bruno?.path) {
    errors.push('Bruno workspace path is required');
  }

  if (!config.bruno?.workspaceName) {
    errors.push('Bruno workspace name is required');
  }

  if (!config.bruno?.environments || config.bruno.environments.length === 0) {
    errors.push('At least one environment is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
