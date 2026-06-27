import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AlertCircle, Clock, CheckCircle2, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

const Dashboard = () => {
  const { toast } = useToast();

  const stats = [
    { name: 'Active Incidents', value: '42', description: 'Requires verification', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Pending Review', value: '18', description: 'Assigned to AI Copilot', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Resolved Incidents', value: '124', description: 'This month', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Average Risk Level', value: 'Medium', description: 'Score: 6.4/10', icon: TrendingUp, color: 'text-orange-500 bg-orange-500/10' },
  ];

  const recentIncidents = [
    { id: '101', description: 'Major pothole blocking left lane on 5th Avenue near Broadway.', category: 'Road Damage', risk: 'high', date: '2 hours ago', status: 'Analysis Done' },
    { id: '102', description: 'Leaking water pipeline flooding intersection at Elm Street.', category: 'Water Leakage', risk: 'critical', date: '4 hours ago', status: 'Copilot Flagged' },
    { id: '103', description: 'Large garbage heap accumulation behind public park gate.', category: 'Illegal Dumping', risk: 'medium', date: '1 day ago', status: 'Resolved' },
    { id: '104', description: 'Broken street light at Elm & 12th Lane creating dark zones.', category: 'Street Light', risk: 'low', date: '2 days ago', status: 'Awaiting Action' },
  ];

  const triggerMockAnalysis = (id) => {
    toast(`Triggered AI re-analysis for Incident #${id}`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Municipal Dashboard" 
        subtitle="Real-time incident streams, risk estimations, and AI insights."
      >
        <Button onClick={() => toast('Exported reports PDF to system downloads.', 'info')} variant="secondary" size="sm">
          Export Report
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </span>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main sections */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Incident list */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Municipal Reports</CardTitle>
            <CardDescription>Live feed of issues uploaded by citizens via mobile channels.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border border-t border-border mt-2">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">Incident #{incident.id}</span>
                      <Badge variant={incident.risk}>{incident.risk} risk</Badge>
                      <span className="text-xs text-muted-foreground">{incident.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{incident.category}</Badge>
                      <Badge variant="secondary" className="bg-secondary">{incident.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => triggerMockAnalysis(incident.id)}
                      icon={Eye}
                    >
                      Analyze
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Copilot Overview */}
        <Card>
          <CardHeader>
            <CardTitle>AI Copilot Insights</CardTitle>
            <CardDescription>Municipal priorities suggested by Gemini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Priority Warning</h4>
                <p className="text-xs text-muted-foreground mt-1">Water pipeline leaks in Elm street have a high risk of local flooding due to forecast rain tomorrow.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Actions</h4>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Dispatch plumbing crew to Elm Street.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Route gravel truck to fill 5th Avenue potholes.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Assign inspector for Illegal Dumping behind park.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
