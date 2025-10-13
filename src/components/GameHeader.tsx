import { useState, useEffect } from 'react';
import karmaCoinImg from '@/assets/karma-coin.png';

interface GameHeaderProps {
  karmaCoins: number;
}

export const GameHeader = ({ karmaCoins }: GameHeaderProps) => {
  const [displayCoins, setDisplayCoins] = useState(0);

  useEffect(() => {
    // Animate coin count
    const interval = setInterval(() => {
      setDisplayCoins(prev => {
        if (prev < karmaCoins) return prev + 1;
        clearInterval(interval);
        return karmaCoins;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [karmaCoins]);

  return (
    <header className="relative bg-card border-b-4 border-border p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-primary text-sm md:text-base pixel-text">
            BACK OF BEYOND RANCH
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-background border-2 border-primary px-3 py-2">
          <img 
            src={karmaCoinImg} 
            alt="Karma Coin" 
            className="w-6 h-6 animate-coin-spin"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="text-primary pixel-text text-xs md:text-sm">
            {displayCoins}
          </span>
        </div>
      </div>
    </header>
  );
};
