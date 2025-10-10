import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export const BookingCTA = () => {
  const handleBooking = () => {
    // Replace with actual booking URL
    window.open('https://www.airbnb.com/rooms/backofbeyondranch', '_blank');
  };

  return (
    <div className="bg-primary/10 border-2 border-primary p-4 md:p-6">
      <div className="text-center space-y-4">
        <h3 className="text-primary text-sm md:text-base pixel-text">
          READY FOR YOUR REAL ADVENTURE?
        </h3>
        
        <p className="text-foreground text-xs pixel-text leading-relaxed max-w-2xl mx-auto">
          Experience the magic of Back of Beyond Ranch in Gold Country. 
          Luxury cabins, farm-to-table dining, and Sierra Nevada views await!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={handleBooking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs px-6 py-6 border-2 border-primary-foreground transition-all hover:translate-y-[-2px] active:translate-y-0"
            style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            BOOK YOUR STAY
          </Button>
          
          <span className="text-accent pixel-text text-xs">
            ⭐ 5-STAR RATED • PET FRIENDLY
          </span>
        </div>
      </div>
    </div>
  );
};
