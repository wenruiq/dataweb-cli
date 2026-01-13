#!/usr/bin/env bun
import { Command } from 'commander';
import { configCommand } from './commands/config';
import { doctorCommand } from './commands/doctor';
import { initCommand } from './commands/init';
import { syncCommand } from './commands/sync';

const program = new Command();

program
  .name('dataweb-cli')
  .description('Sync Swagger/OpenAPI specs to Bruno collections')
  .version('1.0.0');

program
  .command('init')
  .description('Interactive setup and configuration')
  .action(initCommand);

program
  .command('sync <service>')
  .description(
    'Sync a single service or all services (use "all" for bulk sync)',
  )
  .option('-f, --force', 'Force re-sync even if up to date', false)
  .action(syncCommand);

program
  .command('config')
  .description('View or edit configuration')
  .option('-e, --edit', 'Edit configuration interactively', false)
  .option('-p, --path <key>', 'Show specific config path')
  .action(configCommand);

program
  .command('doctor')
  .description('Check system requirements and configuration')
  .action(doctorCommand);

program.parse();
