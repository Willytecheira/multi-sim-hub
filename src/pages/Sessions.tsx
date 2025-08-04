import { useState } from 'react';
import { Plus, Search, MoreHorizontal, QrCode, Trash2, MessageSquare, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSessionStore } from '@/stores/sessionStore';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types';

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
  onShowQR: (session: Session) => void;
  onToggleStatus: (id: string) => void;
}

function SessionCard({ session, onDelete, onShowQR, onToggleStatus }: SessionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-green" />;
      case 'connecting':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case 'disconnected':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <Card className="border-0 shadow-card-custom hover:shadow-elegant transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{session.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {session.status === 'connected' ? (
                <DropdownMenuItem onClick={() => onToggleStatus(session.id)}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onToggleStatus(session.id)}>
                  <Power className="mr-2 h-4 w-4" />
                  Connect
                </DropdownMenuItem>
              )}
              
              {(session.status === 'connecting' || session.status === 'disconnected') && (
                <DropdownMenuItem onClick={() => onShowQR(session)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                View Messages
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDelete(session.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(session.status)}
            <Badge variant="outline" className={getStatusColor(session.status)}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {session.messagesCount} messages
          </span>
        </div>

        {session.phone && (
          <div className="text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="ml-2 font-medium">{session.phone}</span>
          </div>
        )}

        {session.clientInfo && (
          <div className="text-sm">
            <span className="text-muted-foreground">Device:</span>
            <span className="ml-2 font-medium capitalize">{session.clientInfo.platform}</span>
          </div>
        )}

        <div className="text-sm">
          <span className="text-muted-foreground">Last activity:</span>
          <span className="ml-2 font-medium">
            {new Date(session.lastActivity).toLocaleString()}
          </span>
        </div>

        {session.webhookUrl && (
          <div className="text-sm">
            <span className="text-muted-foreground">Webhook:</span>
            <span className="ml-2 font-medium text-primary">Configured</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Sessions() {
  const { sessions, createSession, deleteSession, updateSession, generateQR } = useSessionStore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [qrDialogSession, setQrDialogSession] = useState<Session | null>(null);

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.phone?.includes(searchTerm) ||
    session.status.includes(searchTerm.toLowerCase())
  );

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createSession(newSessionName.trim());
      setIsCreateDialogOpen(false);
      setNewSessionName('');
      toast({
        title: "Session Created",
        description: `Session "${newSessionName}" has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    deleteSession(id);
    toast({
      title: "Session Deleted",
      description: `Session "${session?.name}" has been deleted`,
      variant: "destructive",
    });
  };

  const handleShowQR = async (session: Session) => {
    try {
      await generateQR(session.id);
      setQrDialogSession(session);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    if (session.status === 'connected') {
      updateSession(id, { status: 'disconnected' });
      toast({
        title: "Session Disconnected",
        description: `Session "${session.name}" has been disconnected`,
        variant: "destructive",
      });
    } else {
      updateSession(id, { status: 'connecting' });
      toast({
        title: "Connecting Session",
        description: `Session "${session.name}" is connecting...`,
      });
      
      // Simulate connection after a delay
      setTimeout(() => {
        updateSession(id, { status: 'connected' });
        toast({
          title: "Session Connected",
          description: `Session "${session.name}" is now connected`,
        });
      }, 3000);
    }
  };

  const connectedCount = sessions.filter(s => s.status === 'connected').length;
  const connectingCount = sessions.filter(s => s.status === 'connecting').length;
  const disconnectedCount = sessions.filter(s => s.status === 'disconnected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp sessions and connections
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Create a new WhatsApp session. You'll need to scan the QR code to connect.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="e.g., Customer Support, Sales Team"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                />
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
                onClick={handleCreateSession}
                disabled={isCreating}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Session'}
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
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-green"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connecting</p>
                <p className="text-2xl font-bold text-yellow-600">{connectingCount}</p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disconnected</p>
                <p className="text-2xl font-bold text-red-600">{disconnectedCount}</p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onDelete={handleDeleteSession}
            onShowQR={handleShowQR}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
          <p className="text-muted-foreground mb-4">
            {sessions.length === 0
              ? "Get started by creating your first WhatsApp session."
              : "No sessions match your search criteria."}
          </p>
          {sessions.length === 0 && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Session
            </Button>
          )}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={!!qrDialogSession} 
        onOpenChange={() => setQrDialogSession(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Session</DialogTitle>
            <DialogDescription>
              Scan this QR code with your WhatsApp mobile app to connect the session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrDialogSession?.qrCode && (
              <img
                src={qrDialogSession.qrCode}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            )}
            <div className="text-center">
              <p className="font-medium">{qrDialogSession?.name}</p>
              <p className="text-sm text-muted-foreground">
                Open WhatsApp → Settings → Linked Devices → Link a Device
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => qrDialogSession && handleShowQR(qrDialogSession)}
            >
              Regenerate QR
            </Button>
            <Button onClick={() => setQrDialogSession(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}