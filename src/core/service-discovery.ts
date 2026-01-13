import { glob } from 'bun';
import type { DatawebConfig } from '../types/config';
import type { ServiceInfo } from '../types/service';

export async function discoverService(
  acronym: string,
  config: DatawebConfig,
): Promise<ServiceInfo | null> {
  const pattern = `${config.backend.path}/${config.backend.servicesDir}/**/api/${acronym}/${acronym}.swagger.json`;

  try {
    const files = await Array.fromAsync(glob(pattern));

    if (files.length === 0) {
      return null;
    }

    return {
      acronym,
      swaggerPath: files[0],
      relativePath: files[0].replace(config.backend.path, ''),
    };
  } catch (error) {
    console.error(`Failed to discover service ${acronym}:`, error);
    return null;
  }
}

export async function discoverAllServices(
  config: DatawebConfig,
): Promise<ServiceInfo[]> {
  const pattern = `${config.backend.path}/${config.backend.servicesDir}/**/*.swagger.json`;

  try {
    const files = await Array.fromAsync(glob(pattern));
    const services: ServiceInfo[] = [];

    for (const file of files) {
      const parts = file.split('/');
      const filename = parts[parts.length - 1];
      const dirname = parts[parts.length - 2];
      const parentDir = parts[parts.length - 3];

      // Match pattern: */api/SERVICE_ACRONYM/SERVICE_ACRONYM.swagger.json
      const acronym = filename.replace('.swagger.json', '');
      if (dirname === acronym && parentDir === 'api') {
        services.push({
          acronym,
          swaggerPath: file,
          relativePath: file.replace(config.backend.path, ''),
        });
      }
    }

    return services.sort((a, b) => a.acronym.localeCompare(b.acronym));
  } catch (error) {
    console.error('Failed to discover services:', error);
    return [];
  }
}

export async function serviceExists(
  acronym: string,
  config: DatawebConfig,
): Promise<boolean> {
  const service = await discoverService(acronym, config);
  return service !== null;
}
