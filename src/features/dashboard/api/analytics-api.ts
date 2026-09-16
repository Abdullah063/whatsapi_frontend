import { apiRequest } from 'src/shared/api/http';

export interface AnalyticsOverview {
  generatedAt: string;
  accountId: string | null;
  accounts: { total: number; active: number };
  conversations: { total: number; open: number };
  messages: {
    total: number;
    inbound: number;
    outbound: number;
    today: number;
    received: number;
    queued: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
    failureRate: number;
  };
  audience: { contactRecords: number; blacklisted: number };
  automation: { rules: number; activeRules: number; totalTriggers: number };
  campaigns: { total: number; pending: number; dispatching: number; dispatched: number; cancelled: number };
  subscription: {
    planCode: string;
    planName: string;
    status: string;
    messageLimit: number;
    messagesUsed: number;
    messagesRemaining: number;
  } | null;
}

export function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiRequest('/api/v1/analytics/overview');
}
