import { PhaserGame } from '@/components/PhaserGame';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PhaserIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="sm"
            className="pixel-text text-xs border-2"
          >
            <ArrowLeft className="w-3 h-3 mr-2" />
            BACK
          </Button>
          <h1 className="text-primary text-lg pixel-text">
            BACK OF BEYOND RANCH — RANCH MAP
          </h1>
          <div className="w-20" />
        </div>
      </header>
      
      <main className="container mx-auto">
        <PhaserGame />
      </main>

      <footer className="border-t-2 border-border p-2 text-center mt-8">
        <p className="text-muted-foreground text-[10px] pixel-text">
          © 2025 BACK OF BEYOND RANCH • INTERACTIVE RANCH MAP
        </p>
      </footer>
    </div>
  );
};

export default PhaserIndex;
