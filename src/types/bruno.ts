export interface BrunoJson {
  version: string;
  name: string;
  type: string;
  ignore?: string[];
}

export interface BrunoEnvironment {
  name: string;
  baseUrl: string;
  authToken?: string;
}

export interface BrunoCollectionAuth {
  mode: 'bearer' | 'none' | 'basic';
  token?: string;
}
