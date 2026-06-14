import type { ISharePointRestClient, ISPHttpClientOptions, ISPHttpClientResponse } from '@enacSistema/services/SharePointEnacRepository';

export type AccessTokenProvider = () => Promise<string>;

export class SharePointFetchClient implements ISharePointRestClient {
  private readonly getAccessToken: AccessTokenProvider;
  private readonly siteUrl: string;
  private requestDigest?: { value: string; expiresAt: number };

  public constructor(getAccessToken: AccessTokenProvider, siteUrl: string) {
    this.getAccessToken = getAccessToken;
    this.siteUrl = siteUrl.replace(/\/$/, '');
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

    if (method === 'POST') {
      headers.set('X-RequestDigest', await this.getRequestDigestValue(token));
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body,
      credentials: 'omit'
    });

    return response;
  }

  private async getRequestDigestValue(token: string): Promise<string> {
    const now = Date.now();
    if (this.requestDigest && this.requestDigest.expiresAt > now + 30000) {
      return this.requestDigest.value;
    }

    const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata'
      },
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`SharePoint contextinfo retornou ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const webInformation = payload.FormDigestValue
      ? payload
      : payload.GetContextWebInformation || payload.d?.GetContextWebInformation || {};
    const value = webInformation.FormDigestValue;
    const timeoutSeconds = Number(webInformation.FormDigestTimeoutSeconds || 1800);

    if (!value) {
      throw new Error('SharePoint contextinfo nao retornou FormDigestValue.');
    }

    this.requestDigest = {
      value,
      expiresAt: now + Math.max(60, timeoutSeconds - 60) * 1000
    };

    return value;
  }
}
