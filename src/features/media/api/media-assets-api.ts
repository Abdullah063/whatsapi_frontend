import { apiRequest } from 'src/shared/api/http';

export type MediaAssetType = 'IMAGE' | 'DOCUMENT';

export interface MediaAsset {
  id: string;
  providerAccountId: string;
  name: string;
  originalFilename: string;
  mediaType: MediaAssetType;
  contentType: string;
  sizeBytes: number;
  publicUrl: string;
  createdAt: string;
}

export interface MediaAssetPage {
  content: MediaAsset[];
  page: number;
  size: number;
  totalElements: number;
  imageCount: number;
  documentCount: number;
  totalBytes: number;
}

export interface MediaAssetListOptions {
  search?: string;
  type?: MediaAssetType;
  page?: number;
  size?: number;
}

const basePath = (accountId: string) => `/api/v1/whatsapp/accounts/${accountId}/media-assets`;

export function listMediaAssets(
  accountId: string,
  options: MediaAssetListOptions = {},
): Promise<MediaAssetPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 0),
    size: String(options.size ?? 24),
  });
  if (options.search?.trim()) params.set('search', options.search.trim());
  if (options.type) params.set('type', options.type);
  return apiRequest(`${basePath(accountId)}?${params.toString()}`);
}

export function uploadMediaAsset(accountId: string, file: File, name: string): Promise<MediaAsset> {
  const body = new FormData();
  body.append('file', file);
  if (name.trim()) body.append('name', name.trim());
  return apiRequest(basePath(accountId), { method: 'POST', body });
}

export function deleteMediaAsset(accountId: string, assetId: string): Promise<void> {
  return apiRequest(`${basePath(accountId)}/${assetId}`, { method: 'DELETE' });
}
