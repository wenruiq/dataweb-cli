import type { BrunoJson } from '../types/bruno';
import type { DatawebConfig } from '../types/config';

export async function setupWorkspace(config: DatawebConfig): Promise<void> {
  const brunoPath = config.bruno.path;

  // Create workspace directory
  await Bun.$`mkdir -p ${brunoPath}`.quiet();

  // Create bruno.json
  await createBrunoJson(brunoPath, config.bruno.workspaceName);

  // Create collection.bru with Bearer auth
  await createRootCollection(brunoPath, config.auth);

  // Create environment files
  await createEnvironments(brunoPath, config.bruno.environments);
}

async function createBrunoJson(path: string, name: string): Promise<void> {
  const brunoJsonPath = `${path}/bruno.json`;
  const file = Bun.file(brunoJsonPath);

  if (await file.exists()) {
    return; // Don't overwrite existing config
  }

  const content: BrunoJson = {
    version: '1',
    name,
    type: 'collection',
    ignore: ['node_modules', '.git'],
  };

  await Bun.write(brunoJsonPath, JSON.stringify(content, null, 2));
}

async function createRootCollection(
  path: string,
  authConfig: DatawebConfig['auth'],
): Promise<void> {
  const collectionPath = `${path}/collection.bru`;
  const file = Bun.file(collectionPath);

  if (await file.exists()) {
    return; // Don't overwrite existing collection
  }

  const content = authConfig.injectBearer
    ? `auth {
  mode: bearer
}

auth:bearer {
  token: {{${authConfig.tokenVariable}}}
}
`
    : `auth {
  mode: none
}
`;

  await Bun.write(collectionPath, content);
}

async function createEnvironments(
  path: string,
  environments: Array<{ name: string; baseUrl: string }>,
): Promise<void> {
  const envDir = `${path}/environments`;
  await Bun.$`mkdir -p ${envDir}`.quiet();

  for (const env of environments) {
    const envPath = `${envDir}/${env.name}.bru`;
    const file = Bun.file(envPath);

    if (await file.exists()) {
      continue; // Don't overwrite existing environments
    }

    const content = `vars {
  baseUrl: ${env.baseUrl}
}

vars:secret [
  authToken
]
`;

    await Bun.write(envPath, content);
  }
}

export async function workspaceExists(path: string): Promise<boolean> {
  const brunoJsonFile = Bun.file(`${path}/bruno.json`);
  return await brunoJsonFile.exists();
}

export async function updateBrunoJsonTimestamp(path: string): Promise<void> {
  const brunoJsonPath = `${path}/bruno.json`;
  await Bun.$`touch ${brunoJsonPath}`.quiet();
}
