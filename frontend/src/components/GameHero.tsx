import ranchHero from '@/assets/ranch-hero.png';

export const GameHero = () => {
  return (
    <section className="relative w-full h-64 md:h-96 overflow-hidden scanlines">
      <img 
        src={ranchHero} 
        alt="Back of Beyond Ranch in pixel art style" 
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <h2 className="text-primary text-lg md:text-xl pixel-text mb-2 animate-pixel-bounce">
          WELCOME TO GOLD COUNTRY
        </h2>
        <p className="text-foreground text-xs pixel-text opacity-90">
          Press START to begin your adventure
        </p>
      </div>
    </section>
  );
};
