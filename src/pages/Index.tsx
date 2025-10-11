import { GameHeader } from '@/components/GameHeader';
import { GameHero } from '@/components/GameHero';
import { DialogueBox } from '@/components/DialogueBox';
import { ActionButtons } from '@/components/ActionButtons';
import { BookingCTA } from '@/components/BookingCTA';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';
import { RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const { gameState, startGame, handleAction, closeDialogue, resetGame } = useGameState();

  return (
    <div className="min-h-screen bg-background relative">
      <GameHeader karmaCoins={gameState.karmaCoins} />
      
      <main className="pb-32">
        <GameHero />
        
        <div className="container mx-auto px-4 py-8 space-y-8">
          {!gameState.gameStarted ? (
            <div className="text-center space-y-6 py-12">
              <h2 className="text-primary text-xl md:text-2xl pixel-text animate-pixel-bounce">
                PRESS START
              </h2>
              <p className="text-foreground text-xs pixel-text max-w-md mx-auto leading-relaxed">
                Embark on a 16-bit ranch adventure in California's Gold Country. 
                Help Buck manage the ranch, earn karma coins, and discover the magic 
                of Back of Beyond Ranch!
              </p>
              <Button
                onClick={startGame}
                className="bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-sm px-8 py-6 border-4 border-primary-foreground transition-all hover:translate-y-[-4px] active:translate-y-0"
                style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
              >
                ▶ START GAME
              </Button>
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-primary text-sm pixel-text">RANCH ACTIVITIES</h3>
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    size="sm"
                    className="pixel-text text-xs border-2"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    RESET
                  </Button>
                </div>
                <ActionButtons 
                  onAction={handleAction} 
                  disabled={!!gameState.currentDialogue}
                />
              </section>

              {gameState.clueGameUnlocked && (
                <section className="space-y-4">
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary p-6 text-center space-y-4 animate-pulse">
                    <h3 className="text-primary text-sm md:text-base pixel-text">
                      🔍 NEW MYSTERY UNLOCKED!
                    </h3>
                    <p className="text-foreground text-xs pixel-text leading-relaxed max-w-2xl mx-auto">
                      Shadow of the Golden Frog awaits, detective! Solve clues across Gold Country 
                      and earn up to 30% discount on your ranch stay!
                    </p>
                    <Button
                      onClick={() => navigate('/clue-game')}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground pixel-text text-xs px-6 py-6 border-2 transition-all hover:translate-y-[-2px]"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      START MYSTERY
                    </Button>
                  </div>
                </section>
              )}

              {gameState.discountCodeRevealed && (
                <section className="space-y-4">
                  <div className="bg-primary/10 border-4 border-primary p-6 text-center space-y-4 animate-pixel-bounce">
                    <h3 className="text-primary text-lg pixel-text">
                      🎉 7% DISCOUNT UNLOCKED!
                    </h3>
                    <div className="bg-background border-2 border-primary p-4 inline-block">
                      <p className="text-accent pixel-text text-xl">
                        {gameState.discountCode}
                      </p>
                    </div>
                    <p className="text-foreground text-xs pixel-text max-w-md mx-auto">
                      Use this code when booking your real adventure at Back of Beyond Ranch! 
                      Valid for luxury cabins, pet-friendly stays, and all accommodations.
                    </p>
                  </div>
                </section>
              )}

              <section>
                <BookingCTA />
              </section>

              <section className="space-y-3">
                <h3 className="text-primary text-sm pixel-text">RANCH ATTRACTIONS</h3>
                <p className="text-muted-foreground text-xs pixel-text leading-relaxed">
                  Managed by Leif Pryor, Ranch Manager. Each experience is themed like an enchanting ride at Disneyland—step into worlds of adventure, history, and relaxation!
                </p>
                <div className="space-y-3">
                  <div className="bg-card border-2 border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-base">🐴</span>
                        <span className="text-foreground text-sm pixel-text font-bold">Horse Riding</span>
                      </div>
                      <span className="bg-destructive/80 text-destructive-foreground px-2 py-1 text-[10px] pixel-text border border-destructive">
                        CLOSED
                      </span>
                    </div>
                    <p className="text-foreground text-xs pixel-text leading-relaxed">
                      Like a thrilling frontier expedition, saddle up for guided trails through the Sierra Nevada foothills—perfect for all levels, with stunning views and a touch of Gold Rush spirit. (Temporarily unavailable for maintenance—check back soon!)
                    </p>
                  </div>

                  <div className="bg-card border-2 border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-base">⛏️</span>
                        <span className="text-foreground text-sm pixel-text font-bold">Gold Panning</span>
                      </div>
                      <span className="bg-accent/80 text-accent-foreground px-2 py-1 text-[10px] pixel-text border border-accent">
                        REQUEST EXPERIENCE
                      </span>
                    </div>
                    <p className="text-foreground text-xs pixel-text leading-relaxed">
                      Dive into the rush like prospectors of 1849! Pan for nuggets in nearby streams with expert guidance—strike it rich or just enjoy the thrill. Can be requested as a special add-on experience.
                    </p>
                  </div>

                  <div className="bg-card border-2 border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-base">🏔️</span>
                        <span className="text-foreground text-sm pixel-text font-bold">Hiking Trails</span>
                      </div>
                      <span className="bg-primary/80 text-primary-foreground px-2 py-1 text-[10px] pixel-text border border-primary">
                        OPEN
                      </span>
                    </div>
                    <p className="text-foreground text-xs pixel-text leading-relaxed">
                      Back of Beyond Ranch is nestled in California's historic Gold Country, surrounded by the majestic Sierra Nevada mountains. Explore scenic trails with stunning views and unforgettable Gold Country vistas.
                    </p>
                  </div>

                  <div className="bg-card border-2 border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-base">🌟</span>
                        <span className="text-foreground text-sm pixel-text font-bold">Stargazing</span>
                      </div>
                      <span className="bg-accent/80 text-accent-foreground px-2 py-1 text-[10px] pixel-text border border-accent">
                        REQUEST EXPERIENCE
                      </span>
                    </div>
                    <p className="text-foreground text-xs pixel-text leading-relaxed">
                      Embark on a celestial journey under minimal light pollution skies! The host enhances it upon request with a cozy setup: blankets, chairs, and wine for a romantic or family night gazing at the stars.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {gameState.currentDialogue && (
        <DialogueBox
          speaker={gameState.currentDialogue.speaker}
          text={gameState.currentDialogue.text}
          onClose={closeDialogue}
        />
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-card/90 border-t-2 border-border p-2 text-center backdrop-blur-sm">
        <p className="text-muted-foreground text-[10px] pixel-text">
          © 2025 BACK OF BEYOND RANCH • A LOVABLE PRODUCTION
        </p>
      </footer>
    </div>
  );
};

export default Index;
