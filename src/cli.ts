#!/usr/bin/env bun
import { Command } from 'commander';
import { configCommand } from './commands/config';
import { doctorCommand } from './commands/doctor';
import { initCommand } from './commands/init';
import { syncCommand } from './commands/sync';

const program = new Command();

program
  .name('dataweb')
  .description('Sync Swagger/OpenAPI specs to Bruno collections')
  .version('1.0.0')
  .showHelpAfterError('(add --help for additional information)')
  .showSuggestionAfterError(true);

program
  .command('sync [service]')
  .description(
    'Sync service(s) to Bruno (auto-setup on first run).\n' +
      '  Examples:\n' +
      '    dataweb sync all       # Sync all services\n' +
      '    dataweb sync iam       # Sync specific service',
  )
  .option('-f, --force', 'Force re-sync even if up to date', false)
  .action(async (service, options) => {
    try {
      // If no service provided, guide the user
      if (!service) {
        console.log('\n❌ No service specified.\n');
        console.log('Usage:');
        console.log('  dataweb sync all          # Sync all services');
        console.log('  dataweb sync <service>    # Sync specific service\n');
        console.log('Tip: Run "dataweb config setup" to configure first.\n');
        process.exit(1);
      }
      await syncCommand(service, options);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

const configCmd = program.command('config').description('Manage configuration');

configCmd
  .command('setup')
  .description('Run interactive setup')
  .action(async () => {
    try {
      await initCommand();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .option('-p, --path <key>', 'Show specific config path')
  .action(async (options) => {
    try {
      await configCommand({ ...options, edit: false });
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

configCmd
  .command('edit')
  .description('Edit configuration interactively')
  .action(async () => {
    try {
      await configCommand({ edit: true });
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Check system requirements and configuration')
  .action(async () => {
    try {
      await doctorCommand();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
