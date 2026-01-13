import { cancel, confirm, isCancel } from '@clack/prompts';
import { loadConfig } from '../core/config';
import { setupConfig } from './setup';

export async function initCommand(): Promise<void> {
  const existingConfig = await loadConfig();
  if (existingConfig) {
    const overwrite = await confirm({
      message: 'Configuration already exists. Overwrite?',
      initialValue: false,
    });

    if (isCancel(overwrite) || !overwrite) {
      cancel('Setup cancelled');
      process.exit(0);
    }
  }

  const config = await setupConfig();
  if (!config) {
    process.exit(1);
  }
}
