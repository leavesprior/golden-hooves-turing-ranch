import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RanchMap } from '@/components/RanchMap';
import { LocationInteractionDialog } from '@/components/LocationInteractionDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift } from 'lucide-react';
import { getMapOverview, mapInteraction, redeemKarmaCoins, purchaseShopItem, Location, MapOverview } from '@/services/mapService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MapExplorer = () => {
  const navigate = useNavigate();
  const [mapData, setMapData] = useState<MapOverview | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.user_id);
      } else {
        // Guest mode - use anonymous ID
        const guestId = localStorage.getItem('guest_user_id') || `guest_${Date.now()}`;
        localStorage.setItem('guest_user_id', guestId);
        setUserId(guestId);
      }
    };

    getUserId();
  }, []);

  // Load map data
  useEffect(() => {
    if (!userId) return;

    const loadMap = async () => {
      setIsLoading(true);
      try {
        const data = await getMapOverview(userId);
        setMapData(data);
      } catch (error) {
        console.error('Failed to load map:', error);
        toast.error('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [userId]);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleInteraction = async (action: string) => {
    if (!userId || !selectedLocation) return null;

    const response = await mapInteraction(userId, selectedLocation.id, action);
    
    if (response) {
      // Refresh map data to show updated karma coins and visited status
      const updatedMap = await getMapOverview(userId);
      setMapData(updatedMap);
    }

    return response;
  };

  const handlePurchase = async (itemId: string) => {
    if (!userId || !selectedLocation) return false;

    const success = await purchaseShopItem(userId, selectedLocation.id, itemId);
    
    if (success) {
      // Refresh map data to show updated karma coins
      const updatedMap = await getMapOverview(userId);
      setMapData(updatedMap);
    }

    return success;
  };

  const handleRedeemKarma = async () => {
    if (!userId || !mapData) return;

    if (mapData.karma_coins < 50) {
      toast.error('Insufficient Karma Coins', {
        description: `Need 50 coins, have ${mapData.karma_coins}`,
      });
      return;
    }

    const result = await redeemKarmaCoins(userId, mapData.karma_coins);
    
    if (result) {
      toast.success(`${result.discount}% Discount Generated!`, {
        description: `Code: ${result.code}`,
        duration: 10000,
      });

      // Show discount in a more prominent way
      alert(`🎁 Congratulations!\n\nYour ${result.discount}% Discount Code:\n${result.code}\n\nUse this when booking your stay at Back of Beyond Ranch!`);
    } else {
      toast.error('Failed to redeem coins');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-primary text-2xl pixel-text animate-pulse">
            LOADING MAP...
          </div>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive pixel-text">Failed to load map</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          
          <h1 className="text-primary pixel-text text-sm md:text-base">
            🗺️ RANCH MAP EXPLORER
          </h1>

          {mapData.karma_coins >= 50 && (
            <Button
              onClick={handleRedeemKarma}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground pixel-text text-xs border-2"
            >
              <Gift className="w-3 h-3 mr-2" />
              REDEEM
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-primary/10 border-2 border-primary p-4 text-center">
            <p className="text-primary text-xs pixel-text mb-2">
              🎮 WELCOME TO BACK OF BEYOND RANCH!
            </p>
            <p className="text-foreground text-xs pixel-text leading-relaxed">
              Explore the ranch by clicking on locations. Talk to NPCs, search for treasures, 
              and earn karma coins. Collect 50 coins to unlock special discounts!
            </p>
          </div>

          {/* Map */}
          <RanchMap mapData={mapData} onLocationClick={handleLocationClick} />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border-2 border-border p-3 text-center">
              <p className="text-muted-foreground text-[10px] pixel-text">LOCATIONS</p>
              <p className="text-primary text-xl pixel-text">{mapData.locations.length}</p>
            </div>
            <div className="bg-card border-2 border-border p-3 text-center">
              <p className="text-muted-foreground text-[10px] pixel-text">VISITED</p>
              <p className="text-accent text-xl pixel-text">{mapData.visited_locations.length}</p>
            </div>
            <div className="bg-card border-2 border-border p-3 text-center">
              <p className="text-muted-foreground text-[10px] pixel-text">KARMA COINS</p>
              <p className="text-primary text-xl pixel-text">{mapData.karma_coins}</p>
            </div>
            <div className="bg-card border-2 border-border p-3 text-center">
              <p className="text-muted-foreground text-[10px] pixel-text">HIDDEN</p>
              <p className="text-destructive text-xl pixel-text">{mapData.fog_of_war.length}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Location Interaction Dialog */}
      <LocationInteractionDialog
        location={selectedLocation}
        open={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onInteract={handleInteraction}
      />

      <footer className="fixed bottom-0 left-0 right-0 bg-card/90 border-t-2 border-border p-2 text-center backdrop-blur-sm">
        <p className="text-muted-foreground text-[10px] pixel-text">
          GOLDEN HOOVES QUEST © 2025 BACK OF BEYOND RANCH
        </p>
      </footer>
    </div>
  );
};

export default MapExplorer;
