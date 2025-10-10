import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import sierraShadow from '@/assets/sierra-shadow.png';
import { Lightbulb, RotateCcw } from 'lucide-react';

interface ClueDialogueBoxProps {
  clueText: string;
  onSubmit: (answer: string) => void;
  onHint: () => void;
  onReset: () => void;
  userInput: string;
  onInputChange: (value: string) => void;
  levelName: string;
  progress: string;
}

export const ClueDialogueBox = ({ 
  clueText, 
  onSubmit, 
  onHint,
  onReset,
  userInput,
  onInputChange,
  levelName,
  progress
}: ClueDialogueBoxProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < clueText.length) {
        setDisplayedText(clueText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [clueText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isTyping) {
      onSubmit(userInput);
    }
  };

  return (
    <div className="bg-card/95 border-4 border-border p-4 space-y-4 backdrop-blur-sm grayscale">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img 
            src={sierraShadow} 
            alt="Sierra Shadow" 
            className="w-16 h-16 border-2 border-primary bg-background/50"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-xs pixel-text">SIERRA SHADOW - DETECTIVE</p>
              <p className="text-muted-foreground text-[10px] pixel-text">{levelName}</p>
            </div>
            <p className="text-accent text-xs pixel-text">{progress}</p>
          </div>

          <div className="bg-background/80 p-3 border-2 border-muted min-h-[80px]">
            <p className="text-foreground text-xs pixel-text leading-relaxed">
              {displayedText}
              {isTyping && <span className="animate-pulse">▌</span>}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your answer..."
              disabled={isTyping}
              className="pixel-text text-xs border-2 bg-background/90"
            />
            
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isTyping || !userInput.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-5 border-2"
              >
                SUBMIT ANSWER
              </Button>
              
              <Button
                type="button"
                onClick={onHint}
                disabled={isTyping}
                variant="outline"
                size="sm"
                className="pixel-text text-xs border-2"
              >
                <Lightbulb className="w-3 h-3" />
              </Button>
              
              <Button
                type="button"
                onClick={onReset}
                variant="outline"
                size="sm"
                className="pixel-text text-xs border-2"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
