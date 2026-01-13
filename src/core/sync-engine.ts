import type { DatawebConfig } from '../types/config';
import type { ServiceInfo, SyncOptions, SyncResult } from '../types/service';
import { injectBearerAuth } from './auth-injector';

export async function syncService(
  service: ServiceInfo,
  config: DatawebConfig,
  options: SyncOptions = {},
): Promise<SyncResult> {
  try {
    options.onProgress?.(service.acronym, 'Starting...');

    // Clean existing directory if auto-clean enabled
    if (config.sync.autoClean) {
      const serviceDir = `${config.bruno.path}/${service.acronym}`;
      options.onProgress?.(service.acronym, 'Cleaning...');
      await Bun.$`rm -rf ${serviceDir}`.quiet();
    }

    // Run Bruno CLI import
    options.onProgress?.(service.acronym, 'Importing...');
    const result =
      await Bun.$`bru import openapi -s ${service.swaggerPath} -o ${config.bruno.path} -n ${service.acronym}`.quiet();

    if (result.exitCode !== 0) {
      throw new Error(`Bruno CLI failed: ${result.stderr.toString()}`);
    }

    // Inject Bearer auth if enabled
    if (config.auth.injectBearer) {
      options.onProgress?.(service.acronym, 'Injecting auth...');
      await injectBearerAuth(service.acronym, config);
    }

    // Touch all .bru files to update timestamps
    options.onProgress?.(service.acronym, 'Updating timestamps...');
    const serviceDir = `${config.bruno.path}/${service.acronym}`;
    await Bun.$`find ${serviceDir} -name "*.bru" -exec touch {} \\;`.quiet();

    options.onProgress?.(service.acronym, 'Complete');

    return { service: service.acronym, success: true };
  } catch (error) {
    return {
      service: service.acronym,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function syncAllServices(
  services: ServiceInfo[],
  config: DatawebConfig,
  options: SyncOptions = {},
): Promise<SyncResult[]> {
  const parallelJobs =
    config.sync.parallel || navigator.hardwareConcurrency || 4;

  // Process in batches for parallel execution
  const results: SyncResult[] = [];

  for (let i = 0; i < services.length; i += parallelJobs) {
    const batch = services.slice(i, i + parallelJobs);
    const batchResults = await Promise.all(
      batch.map((service) => syncService(service, config, options)),
    );
    results.push(...batchResults);
  }

  return results;
}

export async function syncServiceByAcronym(
  acronym: string,
  config: DatawebConfig,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { discoverService } = await import('./service-discovery');
  const service = await discoverService(acronym, config);

  if (!service) {
    return {
      service: acronym,
      success: false,
      error: `Service '${acronym}' not found`,
    };
  }

  return await syncService(service, config, options);
}
