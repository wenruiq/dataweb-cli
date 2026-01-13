import { intro, log, outro, spinner } from '@clack/prompts';
import { configExists, loadConfig } from '../core/config';
import {
  validateBackendPath,
  validateBrunoCLI,
  validateBrunoPath,
} from '../utils/validation';

export async function doctorCommand(): Promise<void> {
  intro('dataweb-cli health check');

  const checks = [
    {
      name: 'Bruno CLI installed',
      fn: validateBrunoCLI,
      remediation: 'Install Bruno CLI: npm i -g @usebruno/cli',
    },
    {
      name: 'Configuration file exists',
      fn: configExists,
      remediation: 'Run: dataweb-cli init',
    },
  ];

  const results: Array<{ name: string; passed: boolean; message?: string }> =
    [];

  // Run checks
  for (const check of checks) {
    const s = spinner();
    s.start(check.name);
    const result = await check.fn();

    if (result) {
      s.stop(`${check.name} ✓`);
      results.push({ name: check.name, passed: true });
    } else {
      s.stop(`${check.name} ✗`);
      results.push({
        name: check.name,
        passed: false,
        message: check.remediation,
      });
    }
  }

  // If config exists, validate paths
  if (await configExists()) {
    const config = await loadConfig();
    if (config) {
      // Check backend path
      const s1 = spinner();
      s1.start('Backend path validation');
      const backendValidation = await validateBackendPath(config.backend.path);
      if (backendValidation.valid) {
        s1.stop('Backend path validation ✓');
        results.push({ name: 'Backend path', passed: true });
      } else {
        s1.stop('Backend path validation ✗');
        results.push({
          name: 'Backend path',
          passed: false,
          message: backendValidation.message,
        });
      }

      // Check Bruno path
      const s2 = spinner();
      s2.start('Bruno workspace path validation');
      const brunoValidation = await validateBrunoPath(config.bruno.path);
      if (brunoValidation.valid) {
        s2.stop('Bruno workspace path validation ✓');
        results.push({ name: 'Bruno path', passed: true });
      } else {
        s2.stop('Bruno workspace path validation ✗');
        results.push({
          name: 'Bruno path',
          passed: false,
          message: brunoValidation.message,
        });
      }
    }
  }

  // Summary
  const allPassed = results.every((r) => r.passed);
  const failedCount = results.filter((r) => !r.passed).length;

  if (!allPassed) {
    console.log('\n');
    log.error('Issues found:\n');
    for (const result of results) {
      if (!result.passed) {
        log.error(`  - ${result.name}`);
        if (result.message) {
          log.step(`    ${result.message}`);
        }
      }
    }
  }

  outro(allPassed ? 'All checks passed!' : `${failedCount} issue(s) found`);

  if (!allPassed) {
    process.exit(1);
  }
}
