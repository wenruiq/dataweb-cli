import { log as clackLog } from '@clack/prompts';

export const logger = {
  info: (message: string) => clackLog.info(message),
  success: (message: string) => clackLog.success(message),
  warn: (message: string) => clackLog.warn(message),
  error: (message: string) => clackLog.error(message),
  step: (message: string) => clackLog.step(message),
  message: (message: string) => clackLog.message(message),
};
