import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface ProgressionHUDProps {
  xp: number;
  level: number;
  maxXp: number;
}

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500];

export const ProgressionHUD = ({ xp, level, maxXp }: ProgressionHUDProps) => {
  const [showXpGain, setShowXpGain] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState(0);

  const progressPercent = maxXp > 0 ? (xp / maxXp) * 100 : 0;
  const nextLevel = level + 1;

  // Animate XP gains
  const animateXpGain = (amount: number) => {
    setXpGainAmount(amount);
    setShowXpGain(true);
    setTimeout(() => setShowXpGain(false), 2000);
  };

  return (
    <div className="bg-card/90 border-2 border-primary p-3 space-y-2 backdrop-blur-sm">
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground pixel-text text-xs px-3 py-1 border-2">
            <Sparkles className="w-3 h-3 mr-1" />
            LEVEL {level}
          </Badge>
        </div>
        
        {/* XP Display */}
        <div className="text-xs pixel-text text-foreground">
          {xp}/{maxXp} XP
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress value={progressPercent} className="h-3 bg-muted border border-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] pixel-text text-primary-foreground font-bold drop-shadow-md">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Next Level Info */}
      <div className="text-[10px] pixel-text text-muted-foreground text-center">
        Next: Level {nextLevel} {nextLevel % 2 === 0 && '- New Trait Available!'}
      </div>

      {/* XP Gain Animation */}
      {showXpGain && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 animate-bounce">
          <div className="bg-accent text-accent-foreground px-3 py-1 pixel-text text-xs border-2 border-accent shadow-lg">
            +{xpGainAmount} XP!
          </div>
        </div>
      )}
    </div>
  );
};

// Hook to manage progression updates
export const useProgression = (userId: string | null) => {
  const [progression, setProgression] = useState({
    xp: 0,
    level: 1,
    maxXp: 100,
    traits: [] as string[],
  });

  useEffect(() => {
    if (!userId) return;
    
    // Fetch initial progression from game state
    const fetchProgression = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/game-state/${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const prog = data.progression || { xp: 0, level: 1, traits: [] };
          
          // Calculate max XP for current level
          const maxXp = prog.level < XP_THRESHOLDS.length 
            ? XP_THRESHOLDS[prog.level] 
            : XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
          
          setProgression({
            xp: prog.xp,
            level: prog.level,
            maxXp,
            traits: prog.traits || [],
          });
        }
      } catch (error) {
        console.error('Error fetching progression:', error);
      }
    };

    fetchProgression();
  }, [userId]);

  return { progression, setProgression };
};
