import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Clue {
  id: number;
  text: string;
  answer: string;
  acceptableAnswers: string[]; // Multiple valid answer formats
  hints: string[];
}

interface ClueGameState {
  currentLevel: number;
  currentClueIndex: number;
  solvedClues: number;
  totalDiscount: number;
  unlockedLevels: number;
}

const STORAGE_KEY = 'shadow-of-golden-frog-save';

const levels = [
  {
    name: "Introduction Level",
    clues: [
      {
        id: 1,
        text: "The thief hopped to a festival born from Mark Twain's 1865 tale, where amphibians leap in a town that boomed since the Gold Rush era of 1849.",
        answer: "angels camp",
        acceptableAnswers: ["angels camp", "jumping frog", "jumping frogs", "calaveras county", "frog jubilee", "mark twain", "celebrated jumping frog", "frog festival", "angels camp frog"],
        hints: ["Famous for jumping frogs", "Mark Twain wrote about it", "Annual festival"]
      },
      {
        id: 2,
        text: "Seek giants in the Sequoia Gigantica stand, towering since Native Miwok times, near a town named for a biblical figure.",
        answer: "arnold",
        acceptableAnswers: ["arnold", "sequoia gigantica", "giant sequoia", "calaveras big trees", "big trees", "giant trees"],
        hints: ["Giant sequoia trees", "Near Calaveras Big Trees", "Biblical name"]
      },
      {
        id: 3,
        text: "The shadow flees to where gold was first discovered in California, sparking the rush that changed everything in 1848.",
        answer: "coloma",
        acceptableAnswers: ["coloma", "sutter's mill", "sutters mill", "james marshall", "gold discovery", "american river"],
        hints: ["Gold discovery site", "James Marshall", "American River"]
      }
    ]
  },
  {
    name: "Level 1: Gold Country Mysteries",
    clues: [
      {
        id: 4,
        text: "The shadow flees to bedrock mortars at the largest Miwok collection in North America, echoing tribes who inhabited pre-Gold Rush lands.",
        answer: "indian grinding rock",
        acceptableAnswers: ["indian grinding rock", "grinding rock", "chaw'se", "chawse", "miwok mortars", "bedrock mortars", "petroglyph", "state historic park"],
        hints: ["State Historic Park", "Chaw'se", "Grinding stones"]
      },
      {
        id: 5,
        text: "Trace to a theatre in historic Volcano, CA, blending indigenous art with plays from the mining boom era.",
        answer: "volcano theatre",
        acceptableAnswers: ["volcano theatre", "volcano theater", "volcano", "historic volcano", "cultural gem", "volcano plays"],
        hints: ["Cultural gem", "Historic building", "Performing arts"]
      },
      {
        id: 6,
        text: "Follow tracks to where miners once dug California's richest diggings, now a sleepy town with historic cemetery.",
        answer: "mokelumne hill",
        acceptableAnswers: ["mokelumne hill", "mokelumne", "mok hill", "french hill", "richest diggings", "historic cemetery"],
        hints: ["Rich gold deposits", "Historic cemetery", "French Hill"]
      },
      {
        id: 7,
        text: "The culprit visits caves adorned with natural limestone formations, discovered by miners seeking fortune.",
        answer: "moaning cavern",
        acceptableAnswers: ["moaning cavern", "moaning cave", "limestone cave", "stalactites", "cavern", "rappelling cave"],
        hints: ["Stalactites", "Rappelling tours", "Ancient bones found"]
      },
      {
        id: 8,
        text: "Trail leads to a reservoir where bass and trout swim, serving as a sanctuary gateway to wilderness.",
        answer: "new melones",
        acceptableAnswers: ["new melones", "melones", "new melones lake", "reservoir", "bass fishing", "melones reservoir"],
        hints: ["Lake", "Water recreation", "Near Angels Camp"]
      },
      {
        id: 9,
        text: "The frog vanishes near a festival honoring yesteryear loggers with axe-throwing, rooted in post-Gold Rush timber booms.",
        answer: "west point lumberjack days",
        acceptableAnswers: ["west point", "lumberjack days", "west point lumberjack", "axe throwing", "logging festival", "timber festival"],
        hints: ["Annual festival", "Logging history", "Mountain community"]
      }
    ]
  }
];

export const useClueGame = () => {
  const [gameState, setGameState] = useState<ClueGameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      currentLevel: 0,
      currentClueIndex: 0,
      solvedClues: 0,
      totalDiscount: 0,
      unlockedLevels: 1,
    };
  });

  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const getCurrentClue = (): Clue | null => {
    const level = levels[gameState.currentLevel];
    if (!level) return null;
    return level.clues[gameState.currentClueIndex] || null;
  };

  const getCurrentLevel = () => levels[gameState.currentLevel];

  const checkAnswer = (answer: string) => {
    const currentClue = getCurrentClue();
    if (!currentClue) return false;

    // Normalize input: remove common prefixes, trim, lowercase
    let normalized = answer.toLowerCase().trim();
    const jeopardyPrefixes = ['what is', 'where is', 'who is', 'what are', 'where are'];
    jeopardyPrefixes.forEach(prefix => {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.substring(prefix.length).trim();
      }
    });
    
    // Remove punctuation and extra spaces
    normalized = normalized.replace(/[?.,!]/g, '').replace(/\s+/g, ' ').trim();

    // Check if normalized answer matches any acceptable answer
    const isCorrect = currentClue.acceptableAnswers.some(acceptable => {
      const normalizedAcceptable = acceptable.toLowerCase().trim();
      // Exact match or contains key term
      return normalized === normalizedAcceptable || 
             normalized.includes(normalizedAcceptable) ||
             normalizedAcceptable.split(' ').every(word => normalized.includes(word));
    });

    if (isCorrect) {
      const newSolvedClues = gameState.solvedClues + 1;
      let newDiscount = gameState.totalDiscount;
      
      // Check if level completed
      const level = levels[gameState.currentLevel];
      const isLevelComplete = gameState.currentClueIndex === level.clues.length - 1;

      if (isLevelComplete) {
        // Award discount for level completion
        if (gameState.currentLevel === 0) {
          toast.success('Introduction Complete! Full clue game unlocked!', {
            description: 'Continue to Level 1 for your first discount!',
            duration: 5000,
          });
        } else if (gameState.currentLevel === 1) {
          newDiscount += 10;
          toast.success('Level 1 Complete! 10% Discount Unlocked!', {
            description: 'Check your email for the discount code!',
            duration: 5000,
          });
        } else {
          newDiscount += 5;
          toast.success(`Level ${gameState.currentLevel} Complete! +5% Discount!`, {
            description: `Total discount: ${newDiscount}%`,
            duration: 5000,
          });
        }

        setGameState(prev => ({
          ...prev,
          solvedClues: newSolvedClues,
          totalDiscount: newDiscount,
          currentLevel: prev.currentLevel + 1,
          currentClueIndex: 0,
          unlockedLevels: prev.unlockedLevels + 1,
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          solvedClues: newSolvedClues,
          currentClueIndex: prev.currentClueIndex + 1,
          totalDiscount: newDiscount,
        }));
      }

      toast.success('Correct! The mystery deepens...', {
        duration: 3000,
      });
      setUserInput('');
      setCurrentHintIndex(0);
      return true;
    } else {
      toast.error('Not quite right, detective. Try again!', {
        duration: 2000,
      });
      return false;
    }
  };

  const getHint = () => {
    const currentClue = getCurrentClue();
    if (!currentClue) return;

    if (currentHintIndex < currentClue.hints.length) {
      toast.info(`Hint: ${currentClue.hints[currentHintIndex]}`, {
        duration: 4000,
      });
      setCurrentHintIndex(prev => prev + 1);
    } else {
      toast.info('No more hints available for this clue!', {
        duration: 2000,
      });
    }
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState({
      currentLevel: 0,
      currentClueIndex: 0,
      solvedClues: 0,
      totalDiscount: 0,
      unlockedLevels: 1,
    });
    setCurrentHintIndex(0);
    setUserInput('');
    toast.success('Mystery reset! Starting fresh investigation...');
  };

  return {
    gameState,
    currentClue: getCurrentClue(),
    currentLevel: getCurrentLevel(),
    userInput,
    setUserInput,
    checkAnswer,
    getHint,
    resetGame,
    availableHints: currentHintIndex,
  };
};
