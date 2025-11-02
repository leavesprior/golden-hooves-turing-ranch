import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShopItem as ShopItemType } from '@/services/mapService';
import { Coins, Lock, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShopMenuProps {
  shopType: string;
  items: ShopItemType[];
  karmaCoins: number;
  onPurchase: (itemId: string) => Promise<boolean>;
}

export const ShopMenu = ({ shopType, items, karmaCoins, onPurchase }: ShopMenuProps) => {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItemType) => {
    if (!item.available || item.coming_soon) return;
    
    if (karmaCoins < item.cost) {
      toast.error('Insufficient Karma Coins', {
        description: `Need ${item.cost} coins, have ${karmaCoins}`,
      });
      return;
    }

    setPurchasing(item.id);
    const success = await onPurchase(item.id);
    
    if (success) {
      toast.success('Purchase Successful!', {
        description: `You bought ${item.name} for ${item.cost} karma coins`,
      });
    } else {
      toast.error('Purchase Failed', {
        description: 'Please try again',
      });
    }
    
    setPurchasing(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border-2 border-primary p-3 text-center">
        <p className="text-primary text-sm pixel-text">{shopType.toUpperCase()}</p>
        <p className="text-foreground text-xs pixel-text mt-1">
          Your Balance: <span className="text-accent font-bold">{karmaCoins}</span> Karma Coins
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-card border-2 p-3 space-y-2 ${
              !item.available || item.coming_soon 
                ? 'border-muted opacity-70' 
                : 'border-border hover:border-primary transition-colors'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-foreground text-sm pixel-text font-bold">
                    {item.name}
                  </p>
                  <p className="text-muted-foreground text-xs pixel-text leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 bg-primary/20 px-2 py-1 border border-primary">
                  <Coins className="w-3 h-3 text-primary" />
                  <span className="text-primary text-xs pixel-text font-bold">
                    {item.cost}
                  </span>
                </div>
              </div>
            </div>

            {/* Coming Soon Badge */}
            {item.coming_soon && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent p-2">
                <Clock className="w-4 h-4 text-accent" />
                <p className="text-accent text-xs pixel-text">
                  COMING SOON - Unlock by progressing further!
                </p>
              </div>
            )}

            {/* Not Available Badge */}
            {!item.available && !item.coming_soon && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive p-2">
                <Lock className="w-4 h-4 text-destructive" />
                <p className="text-destructive text-xs pixel-text">
                  LOCKED - Requirements not met
                </p>
              </div>
            )}

            {/* Purchase Button */}
            {item.available && !item.coming_soon && (
              <Button
                onClick={() => handlePurchase(item)}
                disabled={purchasing === item.id || karmaCoins < item.cost}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-4 border-2"
              >
                {purchasing === item.id ? 'PURCHASING...' : 
                 karmaCoins < item.cost ? 'INSUFFICIENT COINS' : 
                 'BUY NOW'}
              </Button>
            )}
          </div>
        ))}
      </div>

      {items.filter(i => i.coming_soon).length > 0 && (
        <div className="bg-accent/10 border border-accent p-2 text-center">
          <p className="text-accent text-xs pixel-text">
            💡 More items unlock as you explore and solve clues!
          </p>
        </div>
      )}
    </div>
  );
};
