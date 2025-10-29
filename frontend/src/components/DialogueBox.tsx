import { useState, useEffect } from 'react';
import ranchOwnerImg from '@/assets/ranch-owner.png';

interface DialogueBoxProps {
  speaker: string;
  text: string;
  onClose?: () => void;
}

export const DialogueBox = ({ speaker, text, onClose }: DialogueBoxProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-border p-4 z-50">
      <div className="container mx-auto">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-background border-2 border-primary p-1">
              <img 
                src={ranchOwnerImg} 
                alt={speaker}
                className="w-full h-full object-contain animate-pixel-bounce"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-primary text-xs md:text-sm pixel-text mb-2">
              {speaker}
            </div>
            <div className="text-foreground text-xs pixel-text leading-relaxed">
              {displayedText}
              {currentIndex < text.length && (
                <span className="inline-block w-2 h-3 bg-primary ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </div>
        
        {onClose && currentIndex >= text.length && (
          <div className="mt-4 text-right">
            <button 
              onClick={onClose}
              className="text-xs pixel-text text-muted-foreground hover:text-primary transition-colors"
            >
              ▶ CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
