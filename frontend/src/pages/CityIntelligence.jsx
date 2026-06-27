import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Map, MapPin, Eye, BarChart4, TrendingUp, Info } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

const CityIntelligence = () => {
  const { toast } = useToast();

  const zones = [
    { name: 'Zone A (North District)', reports: 12, status: 'Stable', risk: 'medium', hotspots: ['High Street (Potholes)', 'Central Park Gate (Dumping)'] },
    { name: 'Zone B (Downtown Core)', reports: 24, status: 'Critical', risk: 'high', hotspots: ['Broadway Avenue (Pipeline leakage)', '5th Cross (Street light out)'] },
    { name: 'Zone C (West Ward)', reports: 6, status: 'Optimal', risk: 'low', hotspots: ['Subway junction (Flooding)'] },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="City Intelligence Hub" 
        subtitle="Geospatial distribution, hot zones mapping, and priority action lists."
      >
        <Button onClick={() => toast('Refreshed city intelligence data.', 'info')} variant="outline" size="sm" icon={TrendingUp}>
          Refresh Analytics
        </Button>
      </PageHeader>

      {/* Map visualization placeholder */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-secondary/15 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Geospatial Incident Map</CardTitle>
            <CardDescription>Visual distribution of active municipal reports across districts.</CardDescription>
          </div>
          <Map className="w-6 h-6 text-primary" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] bg-secondary/20 flex flex-col items-center justify-center text-center relative p-6">
            {/* Mock map lines */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="z-10 space-y-3">
              <MapPin className="w-12 h-12 text-primary mx-auto animate-bounce" />
              <h4 className="font-semibold text-foreground">Interactive Google Map Integration</h4>
              <p className="text-xs text-muted-foreground max-w-sm">Day 1 Mock Layout. Future integrations will overlay Firestore location entries with custom risk pins.</p>
              <Button size="sm" onClick={() => toast('Google Maps authorization placeholder.', 'info')}>
                Authorize Map Client
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {zones.map((zone) => (
          <Card key={zone.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{zone.name}</span>
                <Badge variant={zone.risk}>{zone.status}</Badge>
              </div>
              <CardDescription>{zone.reports} active incidents logged</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Hotspots Identified</span>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  {zone.hotspots.map((spot, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span>{spot}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CityIntelligence;
