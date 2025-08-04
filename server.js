const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Global variables for session management
const sessions = new Map();
const sessionData = new Map();
const webhooks = new Map();
const activityLogs = [];
const users = [
  { 
    id: '1', 
    username: 'admin', 
    password: bcrypt.hashSync('admin123', 10), 
    role: 'admin',
    email: 'admin@whatsapp-api.com'
  },
  { 
    id: '2', 
    username: 'operator', 
    password: bcrypt.hashSync('operator123', 10), 
    role: 'operator',
    email: 'operator@whatsapp-api.com'
  },
  { 
    id: '3', 
    username: 'viewer', 
    password: bcrypt.hashSync('viewer123', 10), 
    role: 'viewer',
    email: 'viewer@whatsapp-api.com'
  }
];

// Utility functions
const logActivity = (type, message, sessionId = null, userId = null) => {
  const log = {
    id: uuidv4(),
    type,
    message,
    sessionId,
    userId,
    timestamp: new Date().toISOString(),
    severity: type.includes('error') ? 'error' : type.includes('delete') ? 'warning' : 'info'
  };
  
  activityLogs.unshift(log);
  if (activityLogs.length > 1000) {
    activityLogs.pop();
  }
  
  // Emit to all connected clients
  io.emit('activity_log', log);
  
  console.log(`[${log.severity.toUpperCase()}] ${log.message}`);
};

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  // In a real application, verify JWT token
  // For demo purposes, we'll use a simple API key
  if (token === 'whatsapp-api-key-2024') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Invalid access token' 
    });
  }
};

// WhatsApp client management
const createWhatsAppClient = (sessionId) => {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: './sessions'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    QRCode.toDataURL(qr, { width: 256, margin: 2 })
      .then(qrCodeDataURL => {
        const session = sessionData.get(sessionId);
        if (session) {
          session.qrCode = qrCodeDataURL;
          session.status = 'connecting';
          sessionData.set(sessionId, session);
          
          io.emit('session_qr', { sessionId, qrCode: qrCodeDataURL });
          logActivity('session_qr_generated', `QR code generated for session ${session.name}`, sessionId);
        }
      });
  });

  client.on('ready', () => {
    const session = sessionData.get(sessionId);
    if (session) {
      session.status = 'connected';
      session.qrCode = null;
      session.lastActivity = new Date().toISOString();
      
      // Get client info
      client.info.then(info => {
        session.clientInfo = {
          platform: info.platform,
          phone: info.wid.user,
          pushname: info.pushname
        };
        sessionData.set(sessionId, session);
        
        io.emit('session_connected', { sessionId, session });
        logActivity('session_connected', `Session ${session.name} connected successfully`, sessionId);
      });
    }
  });

  client.on('disconnected', (reason) => {
    const session = sessionData.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      session.qrCode = null;
      sessionData.set(sessionId, session);
      
      io.emit('session_disconnected', { sessionId, reason });
      logActivity('session_disconnected', `Session ${session.name} disconnected: ${reason}`, sessionId);
    }
    
    sessions.delete(sessionId);
  });

  client.on('message', async (message) => {
    const session = sessionData.get(sessionId);
    if (session) {
      const messageData = {
        id: message.id._serialized,
        sessionId,
        from: message.from,
        to: message.to,
        body: message.body,
        type: message.type,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        isIncoming: !message.fromMe,
        status: 'received'
      };
      
      session.messagesCount += 1;
      session.lastActivity = new Date().toISOString();
      sessionData.set(sessionId, session);
      
      // Send to webhooks
      const webhook = webhooks.get(sessionId);
      if (webhook && webhook.isActive && webhook.events.includes('message_received')) {
        sendWebhook(webhook.url, 'message_received', messageData);
      }
      
      io.emit('message_received', messageData);
      logActivity('message_received', `Message received from ${message.from}`, sessionId);
    }
  });

  return client;
};

// Webhook sender
const sendWebhook = async (url, event, data) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data
      })
    });
    
    if (response.ok) {
      logActivity('webhook_delivered', `Webhook delivered to ${url}`, data.sessionId);
    } else {
      logActivity('webhook_failed', `Webhook failed to ${url}: ${response.status}`, data.sessionId);
    }
  } catch (error) {
    logActivity('webhook_error', `Webhook error to ${url}: ${error.message}`, data.sessionId);
  }
};

// API Routes

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // In a real app, generate JWT token
    const token = 'whatsapp-api-key-2024';
    
    logActivity('login', `User ${username} logged in`, null, user.id);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Sessions
app.get('/api/sessions', authenticateToken, (req, res) => {
  const sessionsArray = Array.from(sessionData.values());
  res.json({
    success: true,
    data: sessionsArray
  });
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Session name is required'
      });
    }
    
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      name,
      status: 'connecting',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      messagesCount: 0,
      isActive: true
    };
    
    sessionData.set(sessionId, session);
    
    // Create WhatsApp client
    const client = createWhatsAppClient(sessionId);
    sessions.set(sessionId, client);
    
    // Initialize client
    client.initialize();
    
    logActivity('session_created', `Session "${name}" created`, sessionId);
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

app.get('/api/sessions/:id/qr', authenticateToken, (req, res) => {
  const { id } = req.params;
  const session = sessionData.get(id);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  if (session.qrCode) {
    res.json({
      success: true,
      data: { qrCode: session.qrCode }
    });
  } else {
    res.json({
      success: false,
      message: 'QR code not available'
    });
  }
});

app.post('/api/sessions/:id/send-text', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { to, message } = req.body;
    
    const client = sessions.get(id);
    const session = sessionData.get(id);
    
    if (!client || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    if (session.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session not connected'
      });
    }
    
    const sentMessage = await client.sendMessage(to, message);
    
    const messageData = {
      id: sentMessage.id._serialized,
      sessionId: id,
      from: 'me',
      to,
      body: message,
      type: 'text',
      timestamp: new Date().toISOString(),
      isIncoming: false,
      status: 'sent'
    };
    
    session.messagesCount += 1;
    session.lastActivity = new Date().toISOString();
    sessionData.set(id, session);
    
    logActivity('message_sent', `Message sent to ${to}`, id);
    
    res.json({
      success: true,
      data: messageData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = sessions.get(id);
    const session = sessionData.get(id);
    
    if (client) {
      await client.destroy();
      sessions.delete(id);
    }
    
    if (session) {
      sessionData.delete(id);
      webhooks.delete(id);
      
      logActivity('session_deleted', `Session "${session.name}" deleted`, id);
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

// Webhooks
app.post('/api/webhook/configure', authenticateToken, (req, res) => {
  try {
    const { sessionId, url, events } = req.body;
    
    const session = sessionData.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const webhook = {
      id: uuidv4(),
      sessionId,
      url,
      events: events || ['message_received', 'message_sent'],
      isActive: true,
      retryCount: 0,
      failureCount: 0
    };
    
    webhooks.set(sessionId, webhook);
    
    session.webhookUrl = url;
    sessionData.set(sessionId, session);
    
    logActivity('webhook_configured', `Webhook configured for session ${session.name}`, sessionId);
    
    res.json({
      success: true,
      data: webhook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to configure webhook'
    });
  }
});

// Metrics
app.get('/api/metrics', authenticateToken, (req, res) => {
  const activeSessions = Array.from(sessionData.values()).filter(s => s.status === 'connected').length;
  const totalSessions = sessionData.size;
  const totalMessages = Array.from(sessionData.values()).reduce((sum, s) => sum + s.messagesCount, 0);
  
  const today = new Date().toDateString();
  const todayLogs = activityLogs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  );
  
  const messagesToday = todayLogs.filter(log => 
    log.type === 'message_sent' || log.type === 'message_received'
  ).length;
  
  const webhooksDelivered = activityLogs.filter(log => 
    log.type === 'webhook_delivered'
  ).length;
  
  const webhooksFailed = activityLogs.filter(log => 
    log.type === 'webhook_failed' || log.type === 'webhook_error'
  ).length;
  
  res.json({
    success: true,
    data: {
      sessionsActive: activeSessions,
      sessionsTotal: totalSessions,
      messagesToday,
      messagesTotal: totalMessages,
      webhooksDelivered,
      webhooksFailed,
      uptime: process.uptime(),
      memoryUsage: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      cpuUsage: Math.random() * 100 // Simulated
    }
  });
});

// Activity logs
app.get('/api/logs', authenticateToken, (req, res) => {
  const { limit = 100, type, sessionId } = req.query;
  
  let logs = [...activityLogs];
  
  if (type) {
    logs = logs.filter(log => log.type === type);
  }
  
  if (sessionId) {
    logs = logs.filter(log => log.sessionId === sessionId);
  }
  
  logs = logs.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: logs
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Multi-Session API running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔑 API Key: whatsapp-api-key-2024`);
  
  logActivity('server_started', `Server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close all WhatsApp sessions
  for (const [sessionId, client] of sessions) {
    try {
      await client.destroy();
      console.log(`✅ Session ${sessionId} closed`);
    } catch (error) {
      console.error(`❌ Error closing session ${sessionId}:`, error);
    }
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;