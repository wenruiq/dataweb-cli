export interface DatawebConfig {
  version: string;
  backend: {
    path: string;
    servicesDir: string;
  };
  bruno: {
    path: string;
    workspaceName: string;
    environments: Array<{
      name: string;
      baseUrl: string;
    }>;
  };
  sync: {
    parallel: number | null;
    autoClean: boolean;
  };
  auth: {
    injectBearer: boolean;
    tokenVariable: string;
  };
}

export const DEFAULT_CONFIG: Partial<DatawebConfig> = {
  version: '1.0.0',
  backend: {
    path: '',
    servicesDir: 'services',
  },
  sync: {
    parallel: null,
    autoClean: true,
  },
  auth: {
    injectBearer: true,
    tokenVariable: 'authToken',
  },
  bruno: {
    path: '',
    workspaceName: 'api-collection',
    environments: [
      { name: 'test', baseUrl: 'https://test.example.com' },
      { name: 'uat', baseUrl: 'https://uat.example.com' },
      { name: 'live', baseUrl: 'https://api.example.com' },
    ],
  },
};
