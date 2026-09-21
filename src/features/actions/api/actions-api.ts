import { apiRequest, jsonBody } from 'src/shared/api/http';

export type ActionMatchType = 'EXACT' | 'STARTS_WITH';
export type ActionExecutionStatus =
  | 'QUEUED'
  | 'DISPATCHING'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT';

export interface ExternalAction {
  id: string;
  providerAccountId: string;
  name: string;
  command: string;
  matchType: ActionMatchType;
  endpointUrl: string;
  secretConfigured: boolean;
  acknowledgementMessage: string;
  pendingMessage: string;
  failureMessage: string;
  timeoutSeconds: number;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveExternalActionInput {
  name: string;
  command: string;
  matchType: ActionMatchType;
  endpointUrl: string;
  sharedSecret?: string;
  acknowledgementMessage: string;
  pendingMessage: string;
  failureMessage: string;
  timeoutSeconds: number;
  priority: number;
  enabled: boolean;
}

export interface ActionExecution {
  id: string;
  actionId: string;
  actionName: string;
  customerWaId: string;
  requestText: string;
  arguments: string;
  status: ActionExecutionStatus;
  attempts: number;
  externalRequestId: string | null;
  lastError: string | null;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionExecutionPage {
  content: ActionExecution[];
  page: number;
  size: number;
  totalElements: number;
}

const basePath = (accountId: string) => `/api/v1/whatsapp/accounts/${accountId}/actions`;

export function listActions(accountId: string): Promise<ExternalAction[]> {
  return apiRequest(basePath(accountId));
}

export function createAction(
  accountId: string,
  input: SaveExternalActionInput,
): Promise<ExternalAction> {
  return apiRequest(basePath(accountId), { method: 'POST', body: jsonBody(input) });
}

export function updateAction(
  accountId: string,
  actionId: string,
  input: SaveExternalActionInput,
): Promise<ExternalAction> {
  return apiRequest(`${basePath(accountId)}/${actionId}`, {
    method: 'PUT',
    body: jsonBody(input),
  });
}

export function deleteAction(accountId: string, actionId: string): Promise<void> {
  return apiRequest(`${basePath(accountId)}/${actionId}`, { method: 'DELETE' });
}

export function listActionExecutions(
  accountId: string,
  page = 0,
  size = 50,
): Promise<ActionExecutionPage> {
  return apiRequest(`${basePath(accountId)}/executions?page=${page}&size=${size}`);
}

export function actionToInput(action: ExternalAction): SaveExternalActionInput {
  return {
    name: action.name,
    command: action.command,
    matchType: action.matchType,
    endpointUrl: action.endpointUrl,
    acknowledgementMessage: action.acknowledgementMessage,
    pendingMessage: action.pendingMessage,
    failureMessage: action.failureMessage,
    timeoutSeconds: action.timeoutSeconds,
    priority: action.priority,
    enabled: action.enabled,
  };
}
