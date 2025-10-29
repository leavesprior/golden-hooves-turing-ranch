import clueGameHero from '@/assets/clue-game-hero.png';

export const ClueGameHero = () => {
  return (
    <div className="relative w-full overflow-hidden border-b-4 border-border">
      <img 
        src={clueGameHero} 
        alt="Shadow of the Golden Frog Mystery" 
        className="w-full h-48 md:h-64 object-cover grayscale"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <h2 className="text-primary text-lg md:text-xl pixel-text animate-pixel-bounce" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.8)' }}>
          SHADOW OF THE GOLDEN FROG
        </h2>
        <p className="text-foreground text-xs pixel-text mt-2" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
          A NOIR MYSTERY IN GOLD COUNTRY
        </p>
      </div>
    </div>
  );
};
