import { useState } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSessionStore } from '@/stores/sessionStore';
import { Message } from '@/types';

export default function Messages() {
  const { sessions, messages, sendMessage, getSessionMessages } = useSessionStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const connectedSessions = sessions.filter(s => s.status === 'connected');
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const sessionMessages = selectedSessionId ? getSessionMessages(selectedSessionId) : [];

  const handleSendMessage = async () => {
    if (!selectedSessionId || !messageText.trim()) return;

    try {
      await sendMessage(selectedSessionId, '+1234567890@c.us', messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '⏳';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sessions Sidebar */}
      <Card className="w-80 border-0 shadow-card-custom">
        <CardHeader className="pb-3">
          <CardTitle>Active Sessions</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {connectedSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedSessionId === session.id ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.phone || 'No phone connected'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {session.messagesCount}
                    </Badge>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 border-0 shadow-card-custom flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedSession.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedSession.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.phone || 'No phone connected'}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Session Info</DropdownMenuItem>
                    <DropdownMenuItem>Export Messages</DropdownMenuItem>
                    <DropdownMenuItem>Clear History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {sessionMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.isIncoming
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          {!message.isIncoming && (
                            <span className="text-xs opacity-70">
                              {getMessageStatusIcon(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {sessionMessages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              {/* Message Input */}
              <div className="p-4">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="mb-2">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[44px] max-h-32 resize-none"
                    />
                  </div>
                  
                  <Button variant="ghost" size="icon" className="mb-2">
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="mb-2 bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a Session</h3>
              <p className="text-muted-foreground">
                Choose a connected session to start messaging
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}