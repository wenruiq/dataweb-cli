import { intro, log, outro } from '@clack/prompts';
import { getConfigPath, loadConfig } from '../core/config';
import { setupConfig } from './setup';

interface ConfigCommandOptions {
  edit?: boolean;
  path?: string;
}

export async function configCommand(
  options: ConfigCommandOptions,
): Promise<void> {
  const config = await loadConfig();

  if (!config) {
    log.error('No configuration found. Run: dataweb-cli init');
    process.exit(1);
  }

  if (options.path) {
    // Show specific path, e.g.: dataweb-cli config --path backend.path
    const value = getNestedValue(config, options.path);
    if (value === undefined) {
      log.error(`Config path '${options.path}' not found`);
      process.exit(1);
    }
    console.log(value);
    return;
  }

  if (options.edit) {
    // Interactive edit - re-run setup
    await setupConfig();
    return;
  }

  // Display current config
  intro('Current configuration');

  const configPath = await getConfigPath();
  log.info(`Config file: ${configPath}\n`);

  console.log(JSON.stringify(config, null, 2));

  outro('');
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}
