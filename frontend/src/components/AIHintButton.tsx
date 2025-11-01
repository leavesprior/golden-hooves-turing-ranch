import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { getAIHint } from '@/services/aiHints';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIHintButtonProps {
  clueText: string;
  userId?: string;
  disabled?: boolean;
}

export const AIHintButton: React.FC<AIHintButtonProps> = ({ 
  clueText, 
  userId,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleGetHint = async () => {
    setIsLoading(true);
    try {
      const prompt = `I'm stuck on this clue: "${clueText}". Can you give me a hint without revealing the answer?`;
      const response = await getAIHint(prompt, userId);
      
      setHintText(response.text);
      setShowDialog(true);
      
      toast.success('Hint from Leif!', {
        description: 'Check what the ranch manager has to say!',
      });
    } catch (error) {
      console.error('Error getting AI hint:', error);
      toast.error('Failed to get hint', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGetHint}
        disabled={disabled || isLoading}
        variant="outline"
        className="pixel-text text-xs border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ASKING LEIF...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-2" />
            ASK LEIF FOR HINT
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="pixel-text bg-card border-4 border-primary">
          <DialogHeader>
            <DialogTitle className="text-primary text-sm pixel-text flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              LEIF PRYOR'S HINT
            </DialogTitle>
            <DialogDescription className="text-foreground text-xs pixel-text leading-relaxed pt-4">
              {hintText}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              onClick={() => setShowDialog(false)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-4 border-2"
            >
              GOT IT, THANKS!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
