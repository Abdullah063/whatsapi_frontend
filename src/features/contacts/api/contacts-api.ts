import { apiRequest, jsonBody } from 'src/shared/api/http';

export interface ContactGroup {
  id: string;
  providerAccountId: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  groupId: string;
  phoneNumber: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPage {
  content: Contact[];
  page: number;
  size: number;
  totalElements: number;
}

export interface SaveContactGroupInput {
  name: string;
  description?: string;
}

export interface ContactInput {
  phoneNumber: string;
  displayName?: string;
}

export interface BulkAddResult {
  requested: number;
  added: number;
  skipped: number;
  invalid: number;
}

export interface ImportIssue {
  rowNumber: number;
  code: string;
  message: string;
}

export interface ContactImportResult {
  totalRows: number;
  added: number;
  skipped: number;
  invalid: number;
  blank: number;
  issuesTruncated: boolean;
  issues: ImportIssue[];
}

export type BlacklistSource = 'MANUAL' | 'PROVIDER_ERROR';

export interface BlacklistEntry {
  id: string;
  providerAccountId: string;
  phoneNumber: string;
  source: BlacklistSource;
  reasonCode: string | null;
  reasonMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlacklistPage {
  content: BlacklistEntry[];
  page: number;
  size: number;
  totalElements: number;
}

export interface AddBlacklistEntryInput {
  phoneNumber: string;
  source: BlacklistSource;
  reasonCode?: string;
  reasonMessage?: string;
}

export interface ReasonCount {
  reasonCode: string;
  count: number;
}

interface ListContactsOptions {
  search?: string;
  page?: number;
  size?: number;
}

interface ListBlacklistOptions extends ListContactsOptions {
  source?: BlacklistSource;
  reasonCode?: string;
}

function accountPath(accountId: string): string {
  return `/api/v1/whatsapp/accounts/${accountId}`;
}

function addSearchParam(params: URLSearchParams, name: string, value: string | undefined) {
  const normalized = value?.trim();
  if (normalized) params.set(name, normalized);
}

export function listContactGroups(accountId: string): Promise<ContactGroup[]> {
  return apiRequest(`${accountPath(accountId)}/contact-groups`);
}

export function createContactGroup(
  accountId: string,
  input: SaveContactGroupInput,
): Promise<ContactGroup> {
  return apiRequest(`${accountPath(accountId)}/contact-groups`, {
    method: 'POST',
    body: jsonBody(input),
  });
}

export function updateContactGroup(
  accountId: string,
  groupId: string,
  input: SaveContactGroupInput,
): Promise<ContactGroup> {
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}`, {
    method: 'PATCH',
    body: jsonBody(input),
  });
}

export function deleteContactGroup(accountId: string, groupId: string): Promise<void> {
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}`, { method: 'DELETE' });
}

export function listContacts(
  accountId: string,
  groupId: string,
  options: ListContactsOptions = {},
): Promise<ContactPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 0),
    size: String(options.size ?? 50),
  });
  addSearchParam(params, 'search', options.search);
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}/contacts?${params}`);
}

export function addContacts(
  accountId: string,
  groupId: string,
  contacts: ContactInput[],
): Promise<BulkAddResult> {
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}/contacts/bulk`, {
    method: 'POST',
    body: jsonBody({ contacts }),
  });
}

export function importContacts(
  accountId: string,
  groupId: string,
  file: File,
): Promise<ContactImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}/contacts/import`, {
    method: 'POST',
    body: formData,
  });
}

export function removeContact(accountId: string, groupId: string, contactId: string): Promise<void> {
  return apiRequest(`${accountPath(accountId)}/contact-groups/${groupId}/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

export function listBlacklist(
  accountId: string,
  options: ListBlacklistOptions = {},
): Promise<BlacklistPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 0),
    size: String(options.size ?? 50),
  });
  addSearchParam(params, 'search', options.search);
  addSearchParam(params, 'source', options.source);
  addSearchParam(params, 'reasonCode', options.reasonCode);
  return apiRequest(`${accountPath(accountId)}/blacklist?${params}`);
}

export function addBlacklistEntry(
  accountId: string,
  input: AddBlacklistEntryInput,
): Promise<BlacklistEntry> {
  return apiRequest(`${accountPath(accountId)}/blacklist`, {
    method: 'POST',
    body: jsonBody(input),
  });
}

export function addBlacklistEntries(
  accountId: string,
  entries: AddBlacklistEntryInput[],
): Promise<BulkAddResult> {
  return apiRequest(`${accountPath(accountId)}/blacklist/bulk`, {
    method: 'POST',
    body: jsonBody({ entries }),
  });
}

export function deleteBlacklistEntry(accountId: string, entryId: string): Promise<void> {
  return apiRequest(`${accountPath(accountId)}/blacklist/${entryId}`, { method: 'DELETE' });
}

export function listBlacklistReasonCodes(accountId: string): Promise<ReasonCount[]> {
  return apiRequest(`${accountPath(accountId)}/blacklist/reason-codes`);
}
