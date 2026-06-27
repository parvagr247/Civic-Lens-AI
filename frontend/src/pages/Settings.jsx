import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, Shield, Server, Database, Sparkles, Sliders } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

const Settings = () => {
  const { toast } = useToast();
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temp, setTemp] = useState(0.2);
  const [firebasePath, setFirebasePath] = useState('classpath:firebase-service-account.json');

  const handleSave = () => {
    toast('Settings saved successfully. Changes will apply to future API calls.', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings & System Configurations" 
        subtitle="Manage model parameters, database connections, and API routing thresholds."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gemini Model Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Gemini AI Model Configurations</CardTitle>
              <CardDescription className="text-xs">Configure ChatClient defaults for Spring AI.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">AI Model ModelName</label>
              <select 
                className="w-full bg-secondary/20 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none p-2.5 rounded-lg text-sm transition-all duration-200"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temperature ({temp})</label>
                <span className="text-xs text-muted-foreground">Controls creativity</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.1"
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database & Firebase settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Google Firebase Credentials</CardTitle>
              <CardDescription className="text-xs">Configure path to service credentials key file.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Credentials File Path</label>
              <input
                type="text"
                className="w-full bg-secondary/20 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none p-2.5 rounded-lg text-sm transition-all duration-200"
                value={firebasePath}
                onChange={(e) => setFirebasePath(e.target.value)}
              />
              <span className="text-[10px] text-muted-foreground block">
                Default: classpath:firebase-service-account.json inside resources folder.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Logging details */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">System Log Levels</CardTitle>
              <CardDescription className="text-xs">Tune backend console logging verbose.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Console Logs Level</label>
              <select className="w-full bg-secondary/20 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none p-2.5 rounded-lg text-sm transition-all duration-200">
                <option value="INFO">INFO (Standard production)</option>
                <option value="DEBUG">DEBUG (Detailed AI workflows)</option>
                <option value="ERROR">ERROR (Severe crashes only)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Security / JWT options placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Security & JWT Tokens</CardTitle>
              <CardDescription className="text-xs">Configure Token lifetimes and authentication.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Standard Bearer Token authentication filters are wired in the backend security filter chain. Once JWT generation is completed in future days, credentials switches will expose tokens lifetime settings here.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="px-6">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
