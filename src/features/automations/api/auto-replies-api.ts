import { apiRequest, jsonBody } from 'src/shared/api/http';

export type MatchType = 'EXACT' | 'STARTS_WITH' | 'CONTAINS' | 'ALL';
export type ResponseType = 'STATIC_TEXT' | 'AI' | 'MEDIA';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface AutoReplyRule {
  id: string;
  providerAccountId: string;
  name: string;
  keywords: string[];
  matchType: MatchType;
  responseType: ResponseType;
  replyText: string;
  aiSystemPrompt: string | null;
  mediaAssetId: string | null;
  priority: number;
  enabled: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  scheduleDays: DayOfWeek[];
  scheduleZone: string;
  allowedPhones: string[];
  cooldownSeconds: number;
  dailyLimit: number;
  triggerCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAutoReplyRuleInput {
  name: string;
  keywords: string[];
  matchType: MatchType;
  responseType: ResponseType;
  replyText: string;
  aiSystemPrompt: string | null;
  mediaAssetId: string | null;
  priority: number;
  enabled: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  scheduleDays: DayOfWeek[];
  scheduleZone: string;
  allowedPhones: string[];
  cooldownSeconds: number;
  dailyLimit: number;
}

export interface PreviewResult {
  matched: boolean;
  rule: AutoReplyRule | null;
  renderedReply: string | null;
}

export type AutomationActivityState = 'QUEUED' | 'PROCESSING' | 'RETRY' | 'COMPLETED' | 'DEAD' | 'CANCELLED' | 'FALLBACK';

export interface AutomationQueueSummary {
  queued: number;
  processing: number;
  retrying: number;
  completed: number;
  dead: number;
}

export interface AutomationActivityItem {
  id: string;
  ruleId: string;
  ruleName: string;
  responseType: ResponseType;
  conversationId: string;
  customerWaId: string;
  inboundText: string | null;
  outboundText: string | null;
  outboundStatus: string | null;
  state: AutomationActivityState;
  attempts: number;
  lastError: string | null;
  occurredAt: string;
}

export interface AutomationActivity {
  queue: AutomationQueueSummary;
  items: AutomationActivityItem[];
}

const basePath = (accountId: string) => `/api/v1/whatsapp/accounts/${accountId}/auto-replies`;

export function listAutoReplyRules(accountId: string): Promise<AutoReplyRule[]> {
  return apiRequest(basePath(accountId));
}

export function createAutoReplyRule(accountId: string, input: SaveAutoReplyRuleInput): Promise<AutoReplyRule> {
  return apiRequest(basePath(accountId), { method: 'POST', body: jsonBody(input) });
}

export function updateAutoReplyRule(accountId: string, ruleId: string, input: SaveAutoReplyRuleInput): Promise<AutoReplyRule> {
  return apiRequest(`${basePath(accountId)}/${ruleId}`, { method: 'PUT', body: jsonBody(input) });
}

export function deleteAutoReplyRule(accountId: string, ruleId: string): Promise<void> {
  return apiRequest(`${basePath(accountId)}/${ruleId}`, { method: 'DELETE' });
}

export function previewAutoReply(accountId: string, message: string, customerWaId: string): Promise<PreviewResult> {
  return apiRequest(`${basePath(accountId)}/preview`, {
    method: 'POST',
    body: jsonBody({ message, customerWaId }),
  });
}

export function getAutomationActivity(accountId: string, limit = 20): Promise<AutomationActivity> {
  return apiRequest(`${basePath(accountId)}/activity?limit=${limit}`);
}

export function ruleToInput(rule: AutoReplyRule): SaveAutoReplyRuleInput {
  return {
    name: rule.name,
    keywords: rule.keywords,
    matchType: rule.matchType,
    responseType: rule.responseType,
    replyText: rule.replyText,
    aiSystemPrompt: rule.aiSystemPrompt,
    mediaAssetId: rule.mediaAssetId,
    priority: rule.priority,
    enabled: rule.enabled,
    scheduleStart: rule.scheduleStart,
    scheduleEnd: rule.scheduleEnd,
    scheduleDays: rule.scheduleDays,
    scheduleZone: rule.scheduleZone,
    allowedPhones: rule.allowedPhones,
    cooldownSeconds: rule.cooldownSeconds,
    dailyLimit: rule.dailyLimit,
  };
}
