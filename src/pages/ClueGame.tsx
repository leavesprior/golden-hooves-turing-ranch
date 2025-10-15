import { ClueGameHero } from '@/components/ClueGameHero';
import { ClueDialogueBox } from '@/components/ClueDialogueBox';
import { Button } from '@/components/ui/button';
import { useClueGame } from '@/hooks/useClueGame';
import { ArrowLeft, Award, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import goldenFrog from '@/assets/golden-frog.png';
import { getDiscountToken } from '@/runtime/discounts';
import { toast } from 'sonner';
import { useState } from 'react';

const ClueGame = () => {
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    gameState,
    currentClue,
    currentLevel,
    userInput,
    setUserInput,
    checkAnswer,
    getHint,
    resetGame,
  } = useClueGame();

  const handleGenerateDiscount = async () => {
    setIsGenerating(true);
    try {
      const result = await getDiscountToken("GHQ10");
      setDiscountCode(result.token);
      toast.success(`${result.percent}% discount code generated!`, {
        description: 'Use this code when booking your stay.'
      });
    } catch (error) {
      console.error('Failed to generate discount:', error);
      toast.error('Failed to generate discount code', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentClue || !currentLevel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <img 
            src={goldenFrog} 
            alt="Golden Frog" 
            className="w-32 h-32 mx-auto animate-pulse"
            style={{ imageRendering: 'pixelated' }}
          />
          <h2 className="text-primary text-xl pixel-text">
            🐸 GOLDEN FROG EARNED!
          </h2>
          <p className="text-foreground text-xs pixel-text max-w-md">
            Level 2 is now unlocked! Return to the ranch and press L to continue your investigation.
          </p>
          
          <div className="space-y-4 w-full max-w-md">
            <div className="bg-primary/10 border-2 border-primary p-4">
              <p className="text-primary text-sm pixel-text">
                ✅ LEVEL 2 UNLOCKED
              </p>
              <p className="text-foreground text-xs pixel-text mt-2">
                Complete Level 2 to earn an additional 5% discount!
              </p>
            </div>

            <div className="bg-accent/20 border-2 border-accent p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-accent" />
                <p className="text-accent text-sm pixel-text">
                  🎁 10% DISCOUNT AVAILABLE
                </p>
              </div>
              
              {!discountCode ? (
                <Button
                  onClick={handleGenerateDiscount}
                  disabled={isGenerating}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground pixel-text text-xs py-6 border-2"
                >
                  {isGenerating ? 'GENERATING...' : 'GENERATE DISCOUNT CODE'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-background border-2 border-accent p-3">
                    <p className="text-muted-foreground text-[10px] pixel-text mb-1">
                      YOUR DISCOUNT CODE:
                    </p>
                    <p className="text-accent text-sm pixel-text font-bold break-all">
                      {discountCode}
                    </p>
                  </div>
                  <p className="text-foreground text-[10px] pixel-text">
                    Use this code when booking your stay at Back of Beyond Ranch. Valid for 30 minutes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => navigate('/game')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs px-6 py-6 border-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO RANCH
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <header className="bg-card border-b-4 border-border p-4">
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
          
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-primary pixel-text text-xs">
              PROGRESS: {gameState.solvedClues}/6 CLUES
            </span>
          </div>
        </div>
      </header>

      <main className="pb-8">
        <ClueGameHero />
        
        <div className="container mx-auto px-4 py-6">
          <ClueDialogueBox
            clueText={currentClue.text}
            onSubmit={checkAnswer}
            onHint={getHint}
            onReset={resetGame}
            userInput={userInput}
            onInputChange={setUserInput}
            levelName={currentLevel.name}
            progress={`CLUE ${gameState.currentClueIndex + 1}/${currentLevel.clues.length}`}
            assistanceText={currentClue.assistanceText}
            resourceLink={currentClue.resourceLink}
            resourceTitle={currentClue.resourceTitle}
          />

          <div className="mt-6 bg-card border-2 border-border p-4 space-y-2">
            <h3 className="text-primary text-xs pixel-text">CASE FILE</h3>
            <div className="text-foreground text-[10px] pixel-text space-y-1">
              <p>• Total Clues Solved: {gameState.solvedClues}</p>
              <p>• Current Level: {gameState.currentLevel + 1}</p>
              <p>• Unlocked Levels: {gameState.unlockedLevels}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/90 border-t-2 border-border p-2 text-center backdrop-blur-sm">
        <p className="text-muted-foreground text-[10px] pixel-text">
          SHADOW OF THE GOLDEN FROG © 2025 BACK OF BEYOND RANCH
        </p>
      </footer>
    </div>
  );
};

export default ClueGame;
