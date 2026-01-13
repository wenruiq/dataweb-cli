import type { DatawebConfig } from '../types/config';
import type { ServiceInfo } from '../types/service';

export async function discoverService(
  acronym: string,
  config: DatawebConfig,
): Promise<ServiceInfo | null> {
  const searchPath = `${config.backend.path}/${config.backend.servicesDir}`;

  try {
    // Use find command instead of glob for better compatibility with compiled binaries
    const result =
      await Bun.$`find ${searchPath} -type f -name "${acronym}.swagger.json" -path "*/api/${acronym}/${acronym}.swagger.json"`.quiet();

    const output = result.stdout.toString().trim();
    if (!output) {
      return null;
    }

    const files = output.split('\n').filter((f) => f.length > 0);
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
  const searchPath = `${config.backend.path}/${config.backend.servicesDir}`;

  try {
    // Use find command to locate all swagger files
    const result =
      await Bun.$`find ${searchPath} -type f -name "*.swagger.json" -path "*/api/*"`.quiet();

    const output = result.stdout.toString().trim();
    if (!output) {
      return [];
    }

    const files = output.split('\n').filter((f) => f.length > 0);
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
