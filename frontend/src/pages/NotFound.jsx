import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-6 max-w-md relative z-10">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          404 - Page Not Found
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          The requested page does not exist or has been moved. Verify the URL or return to the main dashboard.
        </p>

        <div className="pt-4 flex justify-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="primary" 
            icon={ArrowLeft}
            className="px-6 rounded-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
