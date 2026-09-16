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

const basePath = (accountId: string) => `/api/v1/whatsapp/accounts/${accountId}/media-assets`;

export function listMediaAssets(accountId: string): Promise<MediaAsset[]> {
  return apiRequest(basePath(accountId));
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
