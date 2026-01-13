import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  spinner,
  text,
} from '@clack/prompts';
import { loadConfig, saveConfig } from '../core/config';
import type { DatawebConfig } from '../types/config';
import {
  expandTildePath,
  validateBackendPath,
  validateBrunoCLI,
} from '../utils/validation';

export async function initCommand(): Promise<void> {
  intro('dataweb-cli setup');

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

  // Check Bruno CLI
  const s = spinner();
  s.start('Checking for Bruno CLI...');
  const brunoCLIAvailable = await validateBrunoCLI();
  if (!brunoCLIAvailable) {
    s.stop('Bruno CLI not found');
    outro('Install Bruno CLI: npm i -g @usebruno/cli');
    process.exit(1);
  }
  s.stop('Bruno CLI found');

  // Collect configuration
  const backendPath = await text({
    message: 'Backend monorepo path:',
    placeholder: '~/web/one-finance-backend',
    validate: async (value) => {
      if (!value || value.trim().length === 0) {
        return 'Backend path is required';
      }
      const expanded = expandTildePath(value);
      const validation = await validateBackendPath(expanded);
      if (!validation.valid) {
        return validation.message || 'Invalid backend path';
      }
    },
  });

  if (isCancel(backendPath)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  const brunoPath = await text({
    message: 'Bruno workspace path:',
    placeholder: '~/bruno/one-finance',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Bruno path is required';
      }
    },
  });

  if (isCancel(brunoPath)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  const workspaceName = await text({
    message: 'Bruno workspace name:',
    placeholder: 'one-finance',
    initialValue: 'one-finance',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Workspace name is required';
      }
    },
  });

  if (isCancel(workspaceName)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  const parallelJobs = await text({
    message: 'Parallel jobs (leave empty for auto):',
    placeholder: 'auto',
    initialValue: '',
  });

  if (isCancel(parallelJobs)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  const injectAuth = await confirm({
    message: 'Inject Bearer token authentication?',
    initialValue: true,
  });

  if (isCancel(injectAuth)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  // Build configuration
  const config: DatawebConfig = {
    version: '1.0.0',
    backend: {
      path: expandTildePath(backendPath as string),
      servicesDir: 'services',
    },
    bruno: {
      path: expandTildePath(brunoPath as string),
      workspaceName: workspaceName as string,
      environments: [
        { name: 'test', baseUrl: 'https://test.example.com' },
        { name: 'uat', baseUrl: 'https://uat.example.com' },
        { name: 'live', baseUrl: 'https://api.example.com' },
      ],
    },
    sync: {
      parallel:
        parallelJobs && parallelJobs !== ''
          ? Number.parseInt(parallelJobs as string, 10)
          : null,
      autoClean: true,
    },
    auth: {
      injectBearer: injectAuth as boolean,
      tokenVariable: 'authToken',
    },
  };

  // Save configuration
  s.start('Saving configuration...');
  await saveConfig(config);
  s.stop('Configuration saved');

  outro('Setup complete! Run: dataweb-cli sync all');
}
