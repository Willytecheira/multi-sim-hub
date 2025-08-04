import { useState, useEffect } from 'react';
import { 
  Activity, 
  MessageSquare, 
  Smartphone, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Server,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useSessionStore } from '@/stores/sessionStore';

// Mock data generators
const generateHourlyData = () => {
  const hours = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    hours.push({
      hour: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sent: Math.floor(Math.random() * 50) + 10,
      received: Math.floor(Math.random() * 40) + 5,
    });
  }
  return hours;
};

const generateDailyData = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      active: Math.floor(Math.random() * 20) + 10,
      inactive: Math.floor(Math.random() * 10) + 2,
    });
  }
  return days;
};

const sessionStatusData = [
  { name: 'Connected', value: 65, color: '#25D366' },
  { name: 'Disconnected', value: 20, color: '#dc2626' },
  { name: 'Connecting', value: 10, color: '#f59e0b' },
  { name: 'Error', value: 5, color: '#ef4444' },
];

const webhookStatusData = [
  { status: 'Delivered', count: 1250, color: '#25D366' },
  { status: 'Failed', count: 45, color: '#dc2626' },
  { status: 'Pending', count: 12, color: '#f59e0b' },
  { status: 'Retrying', count: 8, color: '#6366f1' },
];

export default function Dashboard() {
  const { sessions, messages } = useSessionStore();
  const [hourlyData] = useState(generateHourlyData());
  const [dailyData] = useState(generateDailyData());
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 34
  });

  // Update system metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics({
        cpu: Math.floor(Math.random() * 40) + 20,
        memory: Math.floor(Math.random() * 30) + 50,
        disk: Math.floor(Math.random() * 20) + 70,
        network: Math.floor(Math.random() * 50) + 10
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const connectedSessions = sessions.filter(s => s.status === 'connected').length;
  const totalMessages = messages.length;
  const todayMessages = messages.filter(m => {
    const today = new Date().toDateString();
    return new Date(m.timestamp).toDateString() === today;
  }).length;

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-red-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getMetricBg = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your WhatsApp Multi-Session API
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="w-4 h-4 mr-1" />
          Real-time
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-card-custom bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{connectedSessions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </span>
              {' '}from last hour
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2
              </span>
              {' '}new today
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-whatsapp">{todayMessages}</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.2%
              </span>
              {' '}from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-custom bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-red-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                -2.1%
              </span>
              {' '}from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Messages Chart */}
        <Card className="border-0 shadow-card-custom">
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
            <CardDescription>
              Real-time message activity in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke="#25D366"
                  fill="#25D366"
                  fillOpacity={0.6}
                  name="Sent"
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stackId="1"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                  name="Received"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sessions Chart */}
        <Card className="border-0 shadow-card-custom">
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
            <CardDescription>
              Active vs inactive sessions over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#25D366"
                  strokeWidth={2}
                  dot={{ fill: '#25D366', strokeWidth: 2, r: 4 }}
                  name="Active"
                />
                <Line
                  type="monotone"
                  dataKey="inactive"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  name="Inactive"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session Status Distribution */}
        <Card className="border-0 shadow-card-custom">
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current distribution of session statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sessionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sessionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sessionStatusData.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {status.name}: {status.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Statistics */}
        <Card className="border-0 shadow-card-custom">
          <CardHeader>
            <CardTitle>Webhook Stats</CardTitle>
            <CardDescription>Webhook delivery status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={webhookStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="status" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  fill="#25D366"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card className="border-0 shadow-card-custom">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>Current server resource usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm">CPU</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(systemMetrics.cpu)}`}>
                  {systemMetrics.cpu}%
                </span>
              </div>
              <Progress value={systemMetrics.cpu} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Memory</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(systemMetrics.memory)}`}>
                  {systemMetrics.memory}%
                </span>
              </div>
              <Progress value={systemMetrics.memory} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm">Disk</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(systemMetrics.disk)}`}>
                  {systemMetrics.disk}%
                </span>
              </div>
              <Progress value={systemMetrics.disk} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Network</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(systemMetrics.network)}`}>
                  {systemMetrics.network}%
                </span>
              </div>
              <Progress value={systemMetrics.network} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}