export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Session {
  id: string;
  name: string;
  phone?: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'pending';
  qrCode?: string;
  lastActivity: string;
  createdAt: string;
  webhookUrl?: string;
  messagesCount: number;
  isActive: boolean;
  clientInfo?: {
    platform: string;
    phone: string;
    pushname: string;
  };
}

export interface Message {
  id: string;
  sessionId: string;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: string;
  isIncoming: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface Webhook {
  id: string;
  sessionId: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  lastTrigger?: string;
  failureCount: number;
}

export interface Metrics {
  sessionsActive: number;
  sessionsTotal: number;
  messagesToday: number;
  messagesTotal: number;
  webhooksDelivered: number;
  webhooksFailed: number;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ActivityLog {
  id: string;
  type: 'session_created' | 'session_deleted' | 'message_sent' | 'message_received' | 'webhook_sent' | 'login' | 'logout';
  message: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  messagesPerHour: Array<{ hour: string; sent: number; received: number }>;
  sessionsOverTime: Array<{ date: string; active: number; inactive: number }>;
  topSessions: Array<{ sessionId: string; name: string; messages: number }>;
  webhookStats: Array<{ status: string; count: number }>;
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}