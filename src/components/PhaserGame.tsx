import { useEffect, useRef } from 'react';
import { startGame } from '@/phaser/game';

export const PhaserGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && gameRef.current) {
      initialized.current = true;
      startGame('phaser-game');
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4 py-8">
      <div 
        id="phaser-game" 
        ref={gameRef}
        className="border-4 border-primary shadow-2xl"
      />
      <div 
        id="hud" 
        className="w-full max-w-[960px] bg-card border-2 border-border p-4 font-mono text-xs text-foreground whitespace-pre-wrap"
      >
        Loading game...
      </div>
    </div>
  );
};
