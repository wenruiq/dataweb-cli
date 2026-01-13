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

    const serviceDir = `${config.bruno.path}/${service.acronym}`;

    // Clean existing directory if auto-clean enabled
    if (config.sync.autoClean) {
      options.onProgress?.(service.acronym, 'Cleaning...');
      await Bun.$`rm -rf ${serviceDir}`.nothrow().quiet();
    }

    // Run Bruno CLI import
    options.onProgress?.(service.acronym, 'Importing...');
    const result =
      await Bun.$`bru import openapi -s ${service.swaggerPath} -o ${config.bruno.path} -n ${service.acronym}`.nothrow();

    // Check if import succeeded by verifying the collection was created
    const collectionFile = Bun.file(`${serviceDir}/collection.bru`);
    const collectionExists = await collectionFile.exists();

    if (!collectionExists) {
      const stderr = result.stderr.toString().trim();
      const stdout = result.stdout.toString().trim();
      const errorMsg =
        stderr || stdout || 'Bruno CLI import failed - collection not created';
      throw new Error(errorMsg);
    }

    // Inject Bearer auth if enabled
    if (config.auth.injectBearer) {
      options.onProgress?.(service.acronym, 'Injecting auth...');
      await injectBearerAuth(service.acronym, config);
    }

    // Touch all .bru files to update timestamps
    options.onProgress?.(service.acronym, 'Updating timestamps...');
    await Bun.$`find ${serviceDir} -name "*.bru" -exec touch {} \\;`
      .nothrow()
      .quiet();

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
