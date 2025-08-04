import { useState } from 'react';
import { Plus, Webhook, Trash2, Edit, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSessionStore } from '@/stores/sessionStore';
import { useToast } from '@/hooks/use-toast';

const availableEvents = [
  { id: 'message_received', label: 'Message Received', description: 'Triggered when a new message is received' },
  { id: 'message_sent', label: 'Message Sent', description: 'Triggered when a message is sent successfully' },
  { id: 'session_connected', label: 'Session Connected', description: 'Triggered when a session connects to WhatsApp' },
  { id: 'session_disconnected', label: 'Session Disconnected', description: 'Triggered when a session disconnects' },
  { id: 'qr_received', label: 'QR Code Generated', description: 'Triggered when a new QR code is generated' },
  { id: 'message_ack', label: 'Message Acknowledgment', description: 'Triggered when message status changes' },
];

interface WebhookConfig {
  id: string;
  sessionId: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  lastTrigger?: string;
  failureCount: number;
  successCount: number;
}

export default function Webhooks() {
  const { sessions } = useSessionStore();
  const { toast } = useToast();
  
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      sessionId: 'session_1',
      url: 'https://api.example.com/webhook/whatsapp',
      events: ['message_received', 'message_sent'],
      isActive: true,
      retryCount: 3,
      lastTrigger: new Date(Date.now() - 5 * 60000).toISOString(),
      failureCount: 2,
      successCount: 1250
    },
    {
      id: '2',
      sessionId: 'session_2',
      url: 'https://webhook.site/abc123def456',
      events: ['session_connected', 'session_disconnected'],
      isActive: false,
      retryCount: 5,
      lastTrigger: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      failureCount: 0,
      successCount: 45
    }
  ]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(3);

  const handleCreateWebhook = () => {
    if (!selectedSessionId || !webhookUrl || selectedEvents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      sessionId: selectedSessionId,
      url: webhookUrl,
      events: selectedEvents,
      isActive: true,
      retryCount,
      failureCount: 0,
      successCount: 0
    };

    setWebhooks([...webhooks, newWebhook]);
    setIsCreateDialogOpen(false);
    setSelectedSessionId('');
    setWebhookUrl('');
    setSelectedEvents([]);
    setRetryCount(3);

    toast({
      title: "Webhook Created",
      description: "Webhook configuration has been saved successfully",
    });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast({
      title: "Webhook Deleted",
      description: "Webhook configuration has been removed",
      variant: "destructive",
    });
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
    
    const webhook = webhooks.find(w => w.id === id);
    toast({
      title: webhook?.isActive ? "Webhook Disabled" : "Webhook Enabled",
      description: `Webhook is now ${webhook?.isActive ? 'disabled' : 'enabled'}`,
    });
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Webhook Test Successful",
        description: `Test payload sent to ${webhook.url}`,
      });
    } catch (error) {
      toast({
        title: "Webhook Test Failed",
        description: "Failed to send test payload",
        variant: "destructive",
      });
    }
  };

  const getSessionName = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.name || 'Unknown Session';
  };

  const getStatusColor = (webhook: WebhookConfig) => {
    if (!webhook.isActive) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    if (webhook.failureCount > 5) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (webhook.failureCount > 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getStatusIcon = (webhook: WebhookConfig) => {
    if (!webhook.isActive) return <XCircle className="w-4 h-4" />;
    if (webhook.failureCount > 5) return <XCircle className="w-4 h-4" />;
    if (webhook.failureCount > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time events
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive events from your sessions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={event.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {event.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retryCount">Retry Count</Label>
                <Select value={retryCount.toString()} onValueChange={(value) => setRetryCount(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="3">3 retries</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                    <SelectItem value="10">10 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
              </div>
              <Webhook className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {webhooks.filter(w => w.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">1,295</p>
              </div>
              <RotateCcw className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="border-0 shadow-card-custom">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{getSessionName(webhook.sessionId)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(webhook)} flex items-center gap-1`}
                  >
                    {getStatusIcon(webhook)}
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Endpoint URL</p>
                <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                  {webhook.url}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Events</p>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {availableEvents.find(e => e.id === event)?.label || event}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Success</p>
                  <p className="font-semibold text-green-600">{webhook.successCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Failures</p>
                  <p className="font-semibold text-red-600">{webhook.failureCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Retries</p>
                  <p className="font-semibold">{webhook.retryCount}</p>
                </div>
              </div>

              {webhook.lastTrigger && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Triggered</p>
                  <p className="text-sm">{new Date(webhook.lastTrigger).toLocaleString()}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(webhook)}
                  className="flex-1"
                >
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleWebhook(webhook.id)}
                  className="flex-1"
                >
                  {webhook.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Webhook className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
          <p className="text-muted-foreground mb-4">
            Create your first webhook to start receiving real-time events.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Webhook
          </Button>
        </div>
      )}
    </div>
  );
}