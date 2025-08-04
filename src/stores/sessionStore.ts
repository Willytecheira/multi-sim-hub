import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Message, Webhook } from '@/types';
import QRCode from 'qrcode';

interface SessionState {
  sessions: Session[];
  messages: Message[];
  webhooks: Webhook[];
  createSession: (name: string) => Promise<Session>;
  deleteSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  generateQR: (sessionId: string) => Promise<string>;
  simulateConnection: (sessionId: string) => void;
  sendMessage: (sessionId: string, to: string, message: string, type?: 'text' | 'image' | 'video' | 'audio' | 'document') => Promise<Message>;
  getSessionMessages: (sessionId: string) => Message[];
  configureWebhook: (sessionId: string, url: string, events: string[]) => void;
  simulateIncomingMessage: (sessionId: string) => void;
}

// Generate mock session data
const generateMockSessions = (): Session[] => [
  {
    id: 'session_1',
    name: 'WhatsApp Business 1',
    phone: '+1234567890',
    status: 'connected',
    lastActivity: new Date().toISOString(),
    createdAt: '2024-01-15T10:30:00Z',
    webhookUrl: 'https://api.example.com/webhook/1',
    messagesCount: 1250,
    isActive: true,
    clientInfo: {
      platform: 'android',
      phone: '+1234567890',
      pushname: 'Business Account 1'
    }
  },
  {
    id: 'session_2',
    name: 'Customer Support',
    phone: '+0987654321',
    status: 'connected',
    lastActivity: new Date(Date.now() - 5 * 60000).toISOString(),
    createdAt: '2024-01-20T14:15:00Z',
    webhookUrl: 'https://api.example.com/webhook/2',
    messagesCount: 890,
    isActive: true,
    clientInfo: {
      platform: 'web',
      phone: '+0987654321',
      pushname: 'Support Team'
    }
  },
  {
    id: 'session_3',
    name: 'Marketing Bot',
    status: 'disconnected',
    lastActivity: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    createdAt: '2024-01-25T09:00:00Z',
    messagesCount: 567,
    isActive: false
  },
  {
    id: 'session_4',
    name: 'Sales Team',
    status: 'connecting',
    lastActivity: new Date(Date.now() - 30000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    messagesCount: 0,
    isActive: true
  }
];

// Generate mock messages
const generateMockMessages = (): Message[] => {
  const messages: Message[] = [];
  const sessions = ['session_1', 'session_2'];
  
  sessions.forEach(sessionId => {
    for (let i = 0; i < 50; i++) {
      const isIncoming = Math.random() > 0.5;
      messages.push({
        id: `msg_${sessionId}_${i}`,
        sessionId,
        from: isIncoming ? `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}` : 'me',
        to: isIncoming ? 'me' : `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        body: isIncoming 
          ? ['Hello!', 'How can I help you?', 'Thank you', 'Is this available?', 'What are your hours?'][Math.floor(Math.random() * 5)]
          : ['Hi there!', 'Sure, I can help with that', 'You\'re welcome!', 'Yes, it is available', 'We are open 9-5 PM'][Math.floor(Math.random() * 5)],
        type: 'text',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60000).toISOString(),
        isIncoming,
        status: ['sent', 'delivered', 'read'][Math.floor(Math.random() * 3)] as any
      });
    }
  });
  
  return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      messages: [],
      webhooks: [],

      createSession: async (name: string): Promise<Session> => {
        const session: Session = {
          id: `session_${Date.now()}`,
          name,
          status: 'connecting',
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          messagesCount: 0,
          isActive: true
        };

        // Generate QR code
        const qrData = `whatsapp-session:${session.id}:${Date.now()}`;
        const qrCode = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#25D366',
            light: '#FFFFFF'
          }
        });
        
        session.qrCode = qrCode;

        set((state) => ({
          sessions: [...state.sessions, session]
        }));

        // Log activity
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        logs.unshift({
          id: Date.now().toString(),
          type: 'session_created',
          message: `Session "${name}" created`,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          severity: 'success'
        });
        localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));

        // Simulate connection after 10 seconds
        setTimeout(() => {
          get().simulateConnection(session.id);
        }, 10000);

        return session;
      },

      deleteSession: (id: string) => {
        const session = get().sessions.find(s => s.id === id);
        
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id),
          messages: state.messages.filter(m => m.sessionId !== id),
          webhooks: state.webhooks.filter(w => w.sessionId !== id)
        }));

        // Log activity
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        logs.unshift({
          id: Date.now().toString(),
          type: 'session_deleted',
          message: `Session "${session?.name || id}" deleted`,
          sessionId: id,
          timestamp: new Date().toISOString(),
          severity: 'warning'
        });
        localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));
      },

      updateSession: (id: string, updates: Partial<Session>) => {
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === id ? { ...s, ...updates, lastActivity: new Date().toISOString() } : s
          )
        }));
      },

      generateQR: async (sessionId: string): Promise<string> => {
        const qrData = `whatsapp-session:${sessionId}:${Date.now()}`;
        const qrCode = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#25D366',
            light: '#FFFFFF'
          }
        });
        
        get().updateSession(sessionId, { qrCode, status: 'connecting' });
        return qrCode;
      },

      simulateConnection: (sessionId: string) => {
        const mockPhones = ['+1234567890', '+0987654321', '+1122334455', '+9988776655'];
        const mockNames = ['Business User', 'Customer Support', 'Sales Team', 'Marketing Bot'];
        
        const phone = mockPhones[Math.floor(Math.random() * mockPhones.length)];
        const pushname = mockNames[Math.floor(Math.random() * mockNames.length)];
        
        get().updateSession(sessionId, {
          status: 'connected',
          phone,
          qrCode: undefined,
          clientInfo: {
            platform: Math.random() > 0.5 ? 'android' : 'web',
            phone,
            pushname
          }
        });

        // Start receiving mock messages
        setTimeout(() => {
          get().simulateIncomingMessage(sessionId);
        }, 5000);
      },

      sendMessage: async (sessionId: string, to: string, body: string, type = 'text'): Promise<Message> => {
        const message: Message = {
          id: `msg_${Date.now()}`,
          sessionId,
          from: 'me',
          to,
          body,
          type,
          timestamp: new Date().toISOString(),
          isIncoming: false,
          status: 'sent'
        };

        set((state) => ({
          messages: [message, ...state.messages],
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { ...s, messagesCount: s.messagesCount + 1, lastActivity: new Date().toISOString() }
              : s
          )
        }));

        // Simulate status updates
        setTimeout(() => {
          set((state) => ({
            messages: state.messages.map(m => 
              m.id === message.id ? { ...m, status: 'delivered' } : m
            )
          }));
        }, 1000);

        setTimeout(() => {
          set((state) => ({
            messages: state.messages.map(m => 
              m.id === message.id ? { ...m, status: 'read' } : m
            )
          }));
        }, 3000);

        // Log activity
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        logs.unshift({
          id: Date.now().toString(),
          type: 'message_sent',
          message: `Message sent to ${to}`,
          sessionId,
          timestamp: new Date().toISOString(),
          severity: 'info'
        });
        localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));

        return message;
      },

      getSessionMessages: (sessionId: string) => {
        return get().messages.filter(m => m.sessionId === sessionId);
      },

      configureWebhook: (sessionId: string, url: string, events: string[]) => {
        const webhook: Webhook = {
          id: `webhook_${Date.now()}`,
          sessionId,
          url,
          events,
          isActive: true,
          retryCount: 0,
          failureCount: 0
        };

        set((state) => ({
          webhooks: [...state.webhooks.filter(w => w.sessionId !== sessionId), webhook],
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, webhookUrl: url } : s
          )
        }));
      },

      simulateIncomingMessage: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.status !== 'connected') return;

        const incomingMessages = [
          'Hello! How can I help you today?',
          'Thank you for your message',
          'Is this service available?',
          'What are your business hours?',
          'I need more information about your products',
          'Can you send me a quote?',
          'When will you be available?'
        ];

        const message: Message = {
          id: `msg_incoming_${Date.now()}`,
          sessionId,
          from: session.phone || `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          to: 'me',
          body: incomingMessages[Math.floor(Math.random() * incomingMessages.length)],
          type: 'text',
          timestamp: new Date().toISOString(),
          isIncoming: true,
          status: 'delivered'
        };

        set((state) => ({
          messages: [message, ...state.messages],
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { ...s, messagesCount: s.messagesCount + 1, lastActivity: new Date().toISOString() }
              : s
          )
        }));

        // Log activity
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        logs.unshift({
          id: Date.now().toString(),
          type: 'message_received',
          message: `Message received from ${message.from}`,
          sessionId,
          timestamp: new Date().toISOString(),
          severity: 'info'
        });
        localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));

        // Schedule next message
        const delay = Math.random() * 60000 + 30000; // 30s to 90s
        setTimeout(() => {
          if (Math.random() > 0.7) { // 30% chance of another message
            get().simulateIncomingMessage(sessionId);
          }
        }, delay);
      }
    }),
    {
      name: 'session-storage',
      onRehydrateStorage: () => (state) => {
        // Initialize with mock data if empty
        if (state && state.sessions.length === 0) {
          state.sessions = generateMockSessions();
          state.messages = generateMockMessages();
        }
      }
    }
  )
);