import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Location, InteractionResponse, feedTreat, getUserInventory, ShopItem } from '@/services/mapService';
import { ShopMenu } from '@/components/ShopMenu';
import { Sparkles, Search, MessageCircle, DoorOpen, Coins, Gift, ShoppingBag, Tractor, Sprout, Beef, Apple, Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationInteractionDialogProps {
  location: Location | null;
  open: boolean;
  onClose: () => void;
  onInteract: (action: string) => Promise<InteractionResponse | null>;
  onPurchase: (itemId: string) => Promise<boolean>;
  karmaCoins: number;
  userId: string;
}

export const LocationInteractionDialog = ({
  location,
  open,
  onClose,
  onInteract,
  onPurchase,
  karmaCoins,
  userId,
}: LocationInteractionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<InteractionResponse | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [showTreatModal, setShowTreatModal] = useState(false);
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [selectedTreat, setSelectedTreat] = useState<string>('');
  const [selectedCreature, setSelectedCreature] = useState<string>('');

  // Load inventory when dialog opens
  useEffect(() => {
    if (open && userId) {
      loadInventory();
    }
  }, [open, userId]);

  const loadInventory = async () => {
    const items = await getUserInventory(userId);
    setInventory(items);
  };

  if (!location) return null;

  // Define creatures available at each location
  const locationCreatures: Record<string, string[]> = {
    stable: ['horse', 'donkey'],
    pasture: ['emu', 'donkey', 'sheep', 'cattle', 'pig', 'horse'],
    barn: ['emu', 'donkey', 'pig', 'sheep', 'cattle'],
  };

  // Get treats from inventory (items with treat effects)
  const availableTreats = inventory.filter(item => 
    ['emu_affinity', 'general_treat', 'training_treat', 'grazing_unlock', 'premium_feed', 'special_feed'].includes(item.effect)
  );

  const handleFeedTreat = async () => {
    if (!selectedTreat || !selectedCreature) {
      toast.error('Please select both a treat and creature');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await feedTreat(userId, location.id, selectedTreat, selectedCreature);
      
      if (response) {
        setCurrentResponse(response);
        setShowTreatModal(false);
        setShowActions(false);
        
        // Show success toast with affinity gain
        toast.success(`Fed treat to ${selectedCreature}!`, {
          description: `+${response.rewards.experience} XP, +${response.rewards.karma_coins} Karma`,
        });

        // Show special event if occurred
        if (response.quest_update) {
          toast.success('🎉 Quest Milestone!', {
            description: response.quest_update.message,
          });
        }

        // Reload inventory
        await loadInventory();
      } else {
        toast.error('Failed to feed treat');
      }
    } catch (error: any) {
      toast.error('Feeding failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
      setSelectedTreat('');
      setSelectedCreature('');
    }
  };

  const handleInteraction = async (action: string) => {
    setIsLoading(true);
    setShowActions(false);
    
    try {
      const response = await onInteract(action);
      
      if (response) {
        setCurrentResponse(response);
        
        // Show rewards toast
        if (response.rewards.karma_coins > 0) {
          toast.success(`+${response.rewards.karma_coins} Karma Coins!`, {
            description: response.rewards.items.length > 0 
              ? `Found: ${response.rewards.items.join(', ')}`
              : undefined,
          });
        }

        // Show location unlock toast
        if (response.location_unlocked) {
          toast.success('New Location Unlocked!', {
            description: 'Check the map for a newly revealed area!',
          });
        }
      } else {
        toast.error('Interaction failed', {
          description: 'Please try again',
        });
        setShowActions(true);
      }
    } catch (error) {
      console.error('Interaction error:', error);
      toast.error('Something went wrong');
      setShowActions(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentResponse(null);
    setShowActions(true);
    onClose();
  };

  const actionIcons: Record<string, any> = {
    enter: DoorOpen,
    talk: MessageCircle,
    search: Search,
    browse_goods: ShoppingBag,
    furrow_fields: Tractor,
    grow_crops: Sprout,
    graze_animals: Beef,
    feed_treat: Apple,
    explore_artifact: Sparkles,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="pixel-text bg-card border-4 border-primary max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary text-lg pixel-text flex items-center gap-2">
            <span className="text-2xl">{location.icon}</span>
            {location.name}
          </DialogTitle>
          <DialogDescription className="text-foreground text-xs pixel-text pt-2">
            {location.description}
            {location.npc_name && (
              <span className="block mt-2 text-accent">
                NPC: {location.npc_name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Show interaction response */}
          {currentResponse && (
            <div className="bg-background/80 border-2 border-muted p-4 space-y-3">
              <p className="text-foreground text-xs pixel-text leading-relaxed whitespace-pre-line">
                {currentResponse.dialogue}
              </p>

              {/* Rewards Display */}
              {currentResponse.rewards.karma_coins > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 p-2 border border-primary">
                  <Coins className="w-4 h-4 text-primary" />
                  <p className="text-primary text-xs pixel-text">
                    +{currentResponse.rewards.karma_coins} KARMA COINS
                  </p>
                </div>
              )}

              {currentResponse.rewards.items.length > 0 && (
                <div className="flex items-center gap-2 bg-accent/10 p-2 border border-accent">
                  <Gift className="w-4 h-4 text-accent" />
                  <p className="text-accent text-xs pixel-text">
                    Found: {currentResponse.rewards.items.join(', ')}
                  </p>
                </div>
              )}

              {/* Shop Menu Display */}
              {currentResponse.shop_menu && (
                <ShopMenu
                  shopType={currentResponse.shop_menu.shop_type}
                  items={currentResponse.shop_menu.items}
                  karmaCoins={karmaCoins}
                  onPurchase={onPurchase}
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && !currentResponse && (
            <div className="space-y-2">
              <p className="text-primary text-xs pixel-text">CHOOSE ACTION:</p>
              <div className="grid grid-cols-1 gap-2">
                {location.interactions.map((action) => {
                  const Icon = actionIcons[action] || Sparkles;
                  const actionLabels: Record<string, string> = {
                    enter: 'ENTER LOCATION',
                    talk: `TALK TO ${location.npc_name?.toUpperCase()}`,
                    search: 'SEARCH AREA',
                    browse_goods: 'BROWSE SHOP',
                    furrow_fields: 'FURROW FIELDS 🚜',
                    grow_crops: 'GROW CROPS 🌱',
                    graze_animals: 'GRAZE ANIMALS 🐴',
                    feed_treat: 'FEED TREAT 🍎',
                  };

                  // Special handling for feed_treat action
                  if (action === 'feed_treat') {
                    return (
                      <Button
                        key={action}
                        onClick={() => setShowTreatModal(true)}
                        disabled={isLoading || availableTreats.length === 0}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground pixel-text text-xs py-6 border-2 flex items-center justify-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {actionLabels[action] || action.toUpperCase()}
                        {availableTreats.length === 0 && ' (NO TREATS)'}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={action}
                      onClick={() => handleInteraction(action)}
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-6 border-2 flex items-center justify-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {actionLabels[action] || action.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Continue/Close button after interaction */}
          {currentResponse && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setCurrentResponse(null);
                  setShowActions(true);
                }}
                variant="outline"
                className="flex-1 pixel-text text-xs border-2"
              >
                TRY ANOTHER ACTION
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs border-2"
              >
                RETURN TO MAP
              </Button>
            </div>
          )}

          {/* Initial close button */}
          {showActions && !currentResponse && (
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full pixel-text text-xs border-2"
            >
              BACK TO MAP
            </Button>
          )}

          {/* Treat Feeding Modal */}
          {showTreatModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border-4 border-accent p-6 max-w-md w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-accent text-lg pixel-text flex items-center gap-2">
                    <Apple className="w-5 h-5" />
                    FEED TREAT
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTreatModal(false)}
                    className="pixel-text text-xs"
                  >
                    ✕
                  </Button>
                </div>

                <p className="text-foreground text-xs pixel-text">
                  Select a treat from your inventory and choose which creature to feed:
                </p>

                {/* Treat Selection */}
                <div className="space-y-2">
                  <label className="text-primary text-xs pixel-text">SELECT TREAT:</label>
                  <Select value={selectedTreat} onValueChange={setSelectedTreat}>
                    <SelectTrigger className="pixel-text text-xs">
                      <SelectValue placeholder="Choose treat..." />
                    </SelectTrigger>
                    <SelectContent className="pixel-text">
                      {availableTreats.map((treat) => (
                        <SelectItem key={treat.id} value={treat.id} className="text-xs">
                          {treat.icon} {treat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Creature Selection */}
                <div className="space-y-2">
                  <label className="text-primary text-xs pixel-text">SELECT CREATURE:</label>
                  <Select value={selectedCreature} onValueChange={setSelectedCreature}>
                    <SelectTrigger className="pixel-text text-xs">
                      <SelectValue placeholder="Choose creature..." />
                    </SelectTrigger>
                    <SelectContent className="pixel-text">
                      {locationCreatures[location.id]?.map((creature) => (
                        <SelectItem key={creature} value={creature} className="text-xs capitalize">
                          {creature === 'emu' && '🦤'} 
                          {creature === 'horse' && '🐴'} 
                          {creature === 'donkey' && '🫏'} 
                          {creature === 'pig' && '🐷'} 
                          {creature === 'sheep' && '🐑'} 
                          {creature === 'cattle' && '🐄'} 
                          {' '}{creature}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Info Box */}
                <div className="bg-accent/10 border border-accent p-3 space-y-1">
                  <p className="text-accent text-xs pixel-text">ℹ️ TREAT EFFECTS:</p>
                  <p className="text-foreground text-[10px] pixel-text">
                    • Increases creature affinity<br />
                    • Earns XP and karma coins<br />
                    • May trigger special events!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowTreatModal(false)}
                    variant="outline"
                    className="flex-1 pixel-text text-xs"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleFeedTreat}
                    disabled={!selectedTreat || !selectedCreature || isLoading}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground pixel-text text-xs"
                  >
                    <Heart className="w-3 h-3 mr-2" />
                    FEED
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
