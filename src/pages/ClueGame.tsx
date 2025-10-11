import { ClueGameHero } from '@/components/ClueGameHero';
import { ClueDialogueBox } from '@/components/ClueDialogueBox';
import { Button } from '@/components/ui/button';
import { useClueGame } from '@/hooks/useClueGame';
import { ArrowLeft, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import goldenFrog from '@/assets/golden-frog.png';

const ClueGame = () => {
  const navigate = useNavigate();
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
            MYSTERY SOLVED!
          </h2>
          <p className="text-foreground text-xs pixel-text max-w-md">
            You've completed all available levels! More mysteries coming soon...
          </p>
          {gameState.totalDiscount > 0 && (
            <div className="bg-primary/10 border-2 border-primary p-4">
              <p className="text-primary text-sm pixel-text">
                TOTAL DISCOUNT EARNED: {gameState.totalDiscount}%
              </p>
              <p className="text-foreground text-xs pixel-text mt-2">
                Use code: GOLDFROG{gameState.totalDiscount} at checkout!
              </p>
            </div>
          )}
          <Button
            onClick={() => navigate('/')}
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
              {gameState.totalDiscount}% DISCOUNT
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

          {gameState.totalDiscount > 0 && (
            <div className="mt-6 bg-primary/10 border-2 border-primary p-4">
              <div className="text-center space-y-2">
                <h3 className="text-primary text-sm pixel-text">
                  CURRENT DISCOUNT: {gameState.totalDiscount}%
                </h3>
                <p className="text-foreground text-xs pixel-text">
                  Keep solving to unlock more savings!
                </p>
              </div>
            </div>
          )}

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
