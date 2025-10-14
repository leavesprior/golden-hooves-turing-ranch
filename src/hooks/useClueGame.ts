import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { saveProgressToStorage } from '@/runtime/progress_bridge';

interface Clue {
  id: number;
  text: string;
  answer: string;
  acceptableAnswers: string[]; // Multiple valid answer formats
  closeAnswers?: string[]; // Answers that are close but need more detail
  hints: string[];
  assistanceText?: string;
  resourceLink?: string;
  resourceTitle?: string;
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
        hints: ["Famous for jumping frogs", "Mark Twain wrote about it", "Annual festival"],
        assistanceText: "This event celebrates local folklore with food stalls and live music—think athletic amphibians! It's held annually in May and draws visitors from around the world.",
        resourceLink: "https://www.frogtown.org/",
        resourceTitle: "Calaveras County Jumping Frog Jubilee"
      },
      {
        id: 2,
        text: "Seek giants in the Sequoia Gigantica stand, towering since Native Miwok times, near a town named for a biblical figure.",
        answer: "arnold",
        acceptableAnswers: ["arnold", "sequoia gigantica", "giant sequoia", "calaveras big trees", "big trees", "giant trees"],
        hints: ["Giant sequoia trees", "Near Calaveras Big Trees", "Biblical name"],
        assistanceText: "These ancient giants can live over 3,000 years! The grove features walking trails through towering sequoias in a peaceful mountain setting.",
        resourceLink: "https://en.wikipedia.org/wiki/Sequoia_(genus)#California",
        resourceTitle: "Sequoia Trees in California"
      },
      {
        id: 3,
        text: "The shadow flees to where gold was first discovered in California, sparking the rush that changed everything in 1848.",
        answer: "coloma",
        acceptableAnswers: ["coloma", "sutter's mill", "sutters mill", "james marshall", "gold discovery", "american river"],
        hints: ["Gold discovery site", "James Marshall", "American River"]
      },
      {
        id: 4,
        text: "The culprit hides in the 'Gem of the Southern Mines,' a perfectly preserved Gold Rush town frozen in time since 1850, where miners once struck it rich.",
        answer: "columbia state historic park",
        acceptableAnswers: ["columbia", "columbia state historic park", "gem of the southern mines", "columbia california", "historic columbia"],
        closeAnswers: ["columbia california", "columbia ca"],
        hints: ["Known as 'Gem of the Southern Mines'", "State Historic Park", "Perfectly preserved Gold Rush town"]
      }
    ]
  },
  {
    name: "Level 1: Gold Country Mysteries",
    clues: [
      {
        id: 5,
        text: "The shadow flees to bedrock mortars at the largest Miwok collection in North America, echoing tribes who inhabited pre-Gold Rush lands.",
        answer: "indian grinding rock",
        acceptableAnswers: ["indian grinding rock", "grinding rock", "chaw'se", "chawse", "miwok mortars", "bedrock mortars", "petroglyph", "state historic park"],
        hints: ["State Historic Park", "Chaw'se", "Grinding stones"],
        assistanceText: "This park features petroglyphs and offers a window to Native American past—largest collection in North America! Visitors can see over 1,000 grinding holes.",
        resourceLink: "https://www.parks.ca.gov/?page_id=553",
        resourceTitle: "California State Parks - Indian Grinding Rock"
      },
      {
        id: 6,
        text: "Trace to a theatre in historic Volcano, CA, blending indigenous art with plays from the mining boom era.",
        answer: "volcano theatre",
        acceptableAnswers: ["volcano theatre", "volcano theater", "volcano", "historic volcano", "cultural gem", "volcano plays"],
        hints: ["Cultural gem", "Historic building", "Performing arts"],
        assistanceText: "This intimate community theater hosts live performances year-round in a historic Gold Rush building, showcasing local talent and touring shows.",
        resourceLink: "https://www.volcanotheatre.org/",
        resourceTitle: "Volcano Theatre Company"
      },
      {
        id: 7,
        text: "Follow tracks to where miners once dug California's richest diggings, now a sleepy town with historic cemetery.",
        answer: "mokelumne hill",
        acceptableAnswers: ["mokelumne hill", "mokelumne", "mok hill", "french hill", "richest diggings", "historic cemetery"],
        hints: ["Rich gold deposits", "Historic cemetery", "French Hill"]
      },
      {
        id: 8,
        text: "The culprit visits caves adorned with natural limestone formations, discovered by miners seeking fortune.",
        answer: "moaning cavern",
        acceptableAnswers: ["moaning cavern", "moaning cave", "limestone cave", "stalactites", "cavern", "rappelling cave"],
        hints: ["Stalactites", "Rappelling tours", "Ancient bones found"]
      },
      {
        id: 9,
        text: "Trail leads to a reservoir where bass and trout swim, serving as a sanctuary gateway to wilderness.",
        answer: "new melones",
        acceptableAnswers: ["new melones", "melones", "new melones lake", "reservoir", "bass fishing", "melones reservoir"],
        hints: ["Lake", "Water recreation", "Near Angels Camp"]
      },
      {
        id: 10,
        text: "The frog vanishes near a festival honoring yesteryear loggers with axe-throwing, rooted in post-Gold Rush timber booms.",
        answer: "west point lumberjack days",
        acceptableAnswers: ["west point", "lumberjack days", "west point lumberjack", "axe throwing", "logging festival", "timber festival"],
        hints: ["Annual festival", "Logging history", "Mountain community"],
        assistanceText: "This festival includes log-rolling, live music, and parades—step back to lumberjack nostalgia! Held annually with family-friendly activities.",
        resourceLink: "https://www.gocalaveras.com/event/lumberjack-days/",
        resourceTitle: "West Point Lumberjack Days"
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
    const jeopardyPrefixes = ['what is', 'where is', 'who is', 'what are', 'where are', 'when is', 'when was'];
    jeopardyPrefixes.forEach(prefix => {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.substring(prefix.length).trim();
      }
    });
    
    // More aggressive normalization: remove articles, apostrophes, and punctuation
    normalized = normalized.replace(/[?.,!']/g, '')
                           .replace(/\b(the|a|an|of)\b/g, '')
                           .replace(/\s+/g, ' ')
                           .trim();

    // Helper function to extract key concepts from a phrase
    const extractKeyConcepts = (phrase: string): string[] => {
      const stopWords = ['the', 'a', 'an', 'of', 'in', 'at', 'to', 'for', 'is', 'was', 'are', 'were'];
      return phrase.toLowerCase()
                   .replace(/[?.,!']/g, '')
                   .split(/\s+/)
                   .filter(word => word.length > 2 && !stopWords.includes(word));
    };

    // Helper function to check if 2/3 of key concepts match
    const checkPartialMatch = (userPhrase: string, targetPhrase: string): boolean => {
      const userConcepts = extractKeyConcepts(userPhrase);
      const targetConcepts = extractKeyConcepts(targetPhrase);
      
      if (targetConcepts.length === 0) return false;
      
      const matchCount = targetConcepts.filter(concept => 
        userConcepts.some(userConcept => 
          userConcept.includes(concept) || concept.includes(userConcept)
        )
      ).length;
      
      // Accept if at least 2/3 of concepts match, or 2+ concepts for short answers
      const threshold = Math.max(2, Math.ceil(targetConcepts.length * 0.66));
      return matchCount >= threshold;
    };

    // Check for close answers first
    if (currentClue.closeAnswers) {
      const isClose = currentClue.closeAnswers.some(close => {
        const normalizedClose = close.toLowerCase().trim().replace(/[?.,!']/g, '');
        return normalized === normalizedClose || 
               normalized.includes(normalizedClose) ||
               checkPartialMatch(normalized, close);
      });
      
      if (isClose) {
        toast.info("You're really close, detective! Give me a little more information...", {
          duration: 4000,
        });
        return false;
      }
    }

    // Check if normalized answer matches any acceptable answer
    const isCorrect = currentClue.acceptableAnswers.some(acceptable => {
      const normalizedAcceptable = acceptable.toLowerCase().trim().replace(/[?.,!']/g, '');
      
      // 1. Exact match
      if (normalized === normalizedAcceptable) return true;
      
      // 2. Contains the acceptable answer
      if (normalized.includes(normalizedAcceptable)) return true;
      
      // 3. All words of acceptable answer appear in user input (any order)
      const acceptableWords = normalizedAcceptable.split(' ').filter(w => w.length > 2);
      if (acceptableWords.length > 0 && acceptableWords.every(word => normalized.includes(word))) return true;
      
      // 4. Partial match with 2/3 of key concepts (creative rewordings)
      if (checkPartialMatch(normalized, acceptable)) return true;
      
      return false;
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
          // Save progress for Level 2 unlock
          saveProgressToStorage({ level1Complete: true, goldenFrog: true });
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
