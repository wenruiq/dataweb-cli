import { intro, log, outro, spinner } from '@clack/prompts';
import { setupWorkspace } from '../core/bruno-workspace';
import { loadConfig } from '../core/config';
import {
  discoverAllServices,
  discoverService,
} from '../core/service-discovery';
import { syncAllServices, syncService } from '../core/sync-engine';
import type { DatawebConfig } from '../types/config';
import { setupConfig } from './setup';

interface SyncCommandOptions {
  force?: boolean;
}

export async function syncCommand(
  service: string,
  options: SyncCommandOptions,
): Promise<void> {
  let config = await loadConfig();

  // Auto-setup if no config exists
  if (!config) {
    log.warn("No configuration found. Let's set it up!\n");
    config = await setupConfig();
    if (!config) {
      process.exit(1);
    }
  }

  if (service === 'all') {
    await syncAll(config, options);
  } else {
    await syncSingle(service, config, options);
  }
}

async function syncSingle(
  serviceAcronym: string,
  config: DatawebConfig,
  options: SyncCommandOptions,
): Promise<void> {
  intro(`Syncing service: ${serviceAcronym}`);

  const s = spinner();

  // Setup workspace
  s.start('Setting up Bruno workspace...');
  await setupWorkspace(config);
  s.stop('Workspace ready');

  // Discover service
  s.start(`Discovering service ${serviceAcronym}...`);
  const service = await discoverService(serviceAcronym, config);

  if (!service) {
    s.stop(`Service ${serviceAcronym} not found`);
    log.error(`Service '${serviceAcronym}' not found in backend monorepo`);
    outro('Sync failed');
    process.exit(1);
  }

  s.stop(`Found: ${service.relativePath}`);

  // Sync service
  s.start(`Syncing ${serviceAcronym}...`);
  const result = await syncService(service, config, {
    force: options.force,
    onProgress: (svc, status) => {
      s.message(`[${svc}] ${status}`);
    },
  });

  if (result.success) {
    s.stop(`${serviceAcronym} synced successfully`);
    outro('Sync complete!');
  } else {
    s.stop(`${serviceAcronym} sync failed`);
    log.error(`Error: ${result.error}`);
    outro('Sync failed');
    process.exit(1);
  }
}

async function syncAll(
  config: DatawebConfig,
  options: SyncCommandOptions,
): Promise<void> {
  intro('Syncing all services');

  const s = spinner();

  // Setup workspace
  s.start('Setting up Bruno workspace...');
  await setupWorkspace(config);
  s.stop('Workspace ready');

  // Discover services
  s.start('Discovering services...');
  const services = await discoverAllServices(config);
  s.stop(`Found ${services.length} service(s)`);

  if (services.length === 0) {
    log.warn('No services found');
    outro('Nothing to sync');
    return;
  }

  // Display discovered services
  log.info('Services to sync:');
  for (const service of services) {
    log.step(`  - ${service.acronym}`);
  }

  // Sync services
  const parallelJobs = config.sync.parallel || 'auto';
  log.info(`\nSyncing with ${parallelJobs} parallel job(s)...\n`);

  const results = await syncAllServices(services, config, {
    force: options.force,
    onProgress: (svc, status) => {
      log.step(`[${svc}] ${status}`);
    },
  });

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n');
  if (failed > 0) {
    log.warn('Failed services:');
    for (const result of results) {
      if (!result.success) {
        log.error(`  - ${result.service}: ${result.error}`);
      }
    }
  }

  outro(`Sync complete: ${successful} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}
