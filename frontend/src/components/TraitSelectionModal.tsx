import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Trait {
  id: string;
  name: string;
  description: string;
  effect: string;
  modifier: number;
}

interface TraitSelectionModalProps {
  open: boolean;
  onClose: () => void;
  traits: Trait[];
  userId: string;
  level: number;
  onTraitSelected: (traitId: string) => void;
}

const traitIcons: Record<string, string> = {
  farmer: '🌾',
  herbalist: '🌿',
  rancher: '🐴',
  lucky: '🍀',
  bargainer: '💰',
  explorer: '🗺️',
};

export const TraitSelectionModal = ({
  open,
  onClose,
  traits,
  userId,
  level,
  onTraitSelected,
}: TraitSelectionModalProps) => {
  const [selecting, setSelecting] = useState(false);

  const handleSelectTrait = async (traitId: string) => {
    setSelecting(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/select-trait/${userId}/${traitId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Trait Activated!`, {
          description: `${data.trait.name} - ${data.message}`,
        });
        onTraitSelected(traitId);
        onClose();
      } else {
        toast.error('Failed to select trait');
      }
    } catch (error) {
      console.error('Error selecting trait:', error);
      toast.error('Something went wrong');
    } finally {
      setSelecting(false);
    }
  };

  const getEffectDisplay = (trait: Trait) => {
    const modifier = trait.modifier;
    if (modifier > 1) {
      return `+${Math.round((modifier - 1) * 100)}% boost`;
    } else if (modifier < 1) {
      return `${Math.round((1 - modifier) * 100)}% discount`;
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="pixel-text bg-card border-4 border-primary max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl pixel-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
            LEVEL {level} REACHED! CHOOSE YOUR TRAIT
          </DialogTitle>
          <DialogDescription className="text-foreground text-xs pixel-text pt-2">
            Select one trait to permanently enhance your abilities. Choose wisely!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {traits.map((trait) => (
            <div
              key={trait.id}
              className="bg-background border-2 border-border hover:border-primary p-4 space-y-3 transition-all group"
            >
              {/* Icon */}
              <div className="text-center">
                <span className="text-5xl">{traitIcons[trait.id] || '✨'}</span>
              </div>

              {/* Name */}
              <h3 className="text-primary text-sm pixel-text text-center font-bold">
                {trait.name}
              </h3>

              {/* Description */}
              <p className="text-foreground text-xs pixel-text leading-relaxed text-center">
                {trait.description}
              </p>

              {/* Effect */}
              <div className="bg-accent/20 border border-accent p-2 text-center">
                <p className="text-accent text-xs pixel-text font-bold">
                  {getEffectDisplay(trait)}
                </p>
              </div>

              {/* Select Button */}
              <Button
                onClick={() => handleSelectTrait(trait.id)}
                disabled={selecting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-4 border-2"
              >
                {selecting ? 'SELECTING...' : 'SELECT TRAIT'}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-primary/10 border border-primary p-3 text-center">
          <p className="text-primary text-xs pixel-text">
            💡 Traits are permanent! Level up again for more choices.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
