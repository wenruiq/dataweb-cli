import type { DatawebConfig } from '../types/config';

export async function injectBearerAuth(
  serviceAcronym: string,
  config: DatawebConfig,
): Promise<void> {
  const collectionPath = `${config.bruno.path}/${serviceAcronym}/collection.bru`;
  const file = Bun.file(collectionPath);

  if (!(await file.exists())) {
    return;
  }

  try {
    const content = await file.text();

    // Replace "auth { mode: none }" with Bearer auth config
    const authNonePattern = /auth\s*\{\s*mode:\s*none\s*\}/g;
    const bearerAuthConfig = `auth {
  mode: bearer
}

auth:bearer {
  token: {{${config.auth.tokenVariable}}}
}`;

    const updatedContent = content.replace(authNonePattern, bearerAuthConfig);

    // Only write if something changed
    if (updatedContent !== content) {
      await Bun.write(collectionPath, updatedContent);
    }
  } catch (error) {
    console.error(`Failed to inject auth for ${serviceAcronym}:`, error);
  }
}

export async function removeAuth(
  serviceAcronym: string,
  config: DatawebConfig,
): Promise<void> {
  const collectionPath = `${config.bruno.path}/${serviceAcronym}/collection.bru`;
  const file = Bun.file(collectionPath);

  if (!(await file.exists())) {
    return;
  }

  try {
    const content = await file.text();

    // Replace any auth config with "auth { mode: none }"
    const authPattern =
      /auth\s*\{[\s\S]*?\}\s*(?:auth:[a-z]+\s*\{[\s\S]*?\})?/g;
    const noAuthConfig = `auth {
  mode: none
}`;

    const updatedContent = content.replace(authPattern, noAuthConfig);

    // Only write if something changed
    if (updatedContent !== content) {
      await Bun.write(collectionPath, updatedContent);
    }
  } catch (error) {
    console.error(`Failed to remove auth for ${serviceAcronym}:`, error);
  }
}
