import type { ISharePointRestClient, ISPHttpClientOptions, ISPHttpClientResponse } from '@enacSistema/services/SharePointEnacRepository';

export type AccessTokenProvider = () => Promise<string>;

export class SharePointFetchClient implements ISharePointRestClient {
  private readonly getAccessToken: AccessTokenProvider;

  public constructor(getAccessToken: AccessTokenProvider) {
    this.getAccessToken = getAccessToken;
  }

  public async get(url: string): Promise<ISPHttpClientResponse> {
    return this.request(url, 'GET');
  }

  public async post(url: string, _configuration: unknown, options: ISPHttpClientOptions): Promise<ISPHttpClientResponse> {
    return this.request(url, 'POST', options);
  }

  private async request(url: string, method: 'GET' | 'POST', options?: ISPHttpClientOptions): Promise<ISPHttpClientResponse> {
    const token = await this.getAccessToken();
    const headers = new Headers(options?.headers || {});

    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', headers.get('Accept') || 'application/json;odata=nometadata');

    if (method === 'POST' && options?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json;odata=nometadata');
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body,
      credentials: 'omit'
    });

    return response;
  }
}
