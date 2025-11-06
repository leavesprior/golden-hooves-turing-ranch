import { useEffect, useRef, useState } from 'react';
import { Location, MapOverview } from '@/services/mapService';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

interface RanchMapProps {
  mapData: MapOverview;
  onLocationClick: (location: Location) => void;
}

export const RanchMap = ({ mapData, onLocationClick }: RanchMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 800);
      const maxHeight = Math.min(window.innerHeight - 200, 600);
      setCanvasSize({ width: maxWidth, height: maxHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw 16-bit style background
    // Sky gradient (top 40%)
    const skyHeight = canvas.height * 0.4;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
    skyGradient.addColorStop(0, '#87CEEB'); // Sky blue
    skyGradient.addColorStop(0.5, '#98D8C8'); // Light teal
    skyGradient.addColorStop(1, '#6BA7CC'); // Deeper blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, skyHeight);

    // Grass tiles (16-bit checkerboard pattern)
    const tileSize = 16;
    for (let y = skyHeight; y < canvas.height - 100; y += tileSize) {
      for (let x = 0; x < canvas.width; x += tileSize) {
        const variant = ((x / tileSize) + (y / tileSize)) % 2;
        const grassColor = variant === 0 ? '#6B8E23' : '#7FA524';
        ctx.fillStyle = grassColor;
        ctx.fillRect(x, y, tileSize, tileSize);
        
        // Add random darker pixels for 16-bit detail
        if (Math.random() > 0.7) {
          ctx.fillStyle = '#5C7A1F';
          const px = x + Math.floor(Math.random() * (tileSize - 2));
          const py = y + Math.floor(Math.random() * (tileSize - 2));
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }

    // Dirt path (bottom area)
    const pathY = canvas.height - 100;
    const pathHeight = 40;
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, pathY, canvas.width, pathHeight);
    
    // Add dirt texture (16-bit style)
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = pathY + Math.random() * pathHeight;
      const dirtColor = Math.random() > 0.5 ? '#9B8265' : '#7A6345';
      ctx.fillStyle = dirtColor;
      ctx.fillRect(x, y, 4, 4);
    }

    // Fence posts (16-bit wood style)
    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < canvas.width; i += 80) {
      // Post
      ctx.fillRect(i, canvas.height - 80, 8, 40);
      // Highlight for 3D effect
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(i, canvas.height - 80, 2, 40);
      ctx.fillStyle = '#8B4513';
      // Top rail
      ctx.fillRect(i - 4, canvas.height - 85, 16, 5);
    }

    // Draw locations
    mapData.locations.forEach((location) => {
      if (!location.unlocked && mapData.fog_of_war.includes(location.id)) {
        // Draw fog for locked locations (16-bit style)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          location.coordinates[0] - 40,
          location.coordinates[1] - 40,
          80,
          80
        );
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('???', location.coordinates[0], location.coordinates[1]);
        return;
      }

      const isVisited = mapData.visited_locations.includes(location.id);
      const isHovered = hoveredLocation === location.id;

      // Draw location hotspot (16-bit style with 3D effect)
      ctx.save();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(location.coordinates[0], location.coordinates[1] + 3, 34, 0, Math.PI * 2);
      ctx.fill();

      // Main circle
      ctx.fillStyle = isVisited ? '#4CAF50' : '#FFA500';
      ctx.beginPath();
      ctx.arc(location.coordinates[0], location.coordinates[1], 32, 0, Math.PI * 2);
      ctx.fill();

      // Highlight for 3D effect (top-left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(
        location.coordinates[0] - 8,
        location.coordinates[1] - 8,
        16,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Border
      ctx.strokeStyle = isHovered ? '#FFD700' : '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(location.coordinates[0], location.coordinates[1], 32, 0, Math.PI * 2);
      ctx.stroke();

      // Glow effect for hovered (16-bit style)
      if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(location.coordinates[0], location.coordinates[1], 36, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Draw icon (emoji)
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        location.icon,
        location.coordinates[0],
        location.coordinates[1]
      );

      // Draw name below (16-bit pixel font)
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(
        location.name,
        location.coordinates[0],
        location.coordinates[1] + 50
      );
      ctx.fillText(
        location.name,
        location.coordinates[0],
        location.coordinates[1] + 50
      );

      // Sparkle for unvisited (16-bit style)
      if (!isVisited && isHovered) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText('✨', location.coordinates[0] - 40, location.coordinates[1] - 40);
        ctx.fillText('✨', location.coordinates[0] + 40, location.coordinates[1] - 40);
      }
    });
  }, [mapData, hoveredLocation, canvasSize]);

  // Handle clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on any location (within 40px radius)
    for (const location of mapData.locations) {
      if (!location.unlocked && mapData.fog_of_war.includes(location.id)) continue;

      const dx = x - location.coordinates[0];
      const dy = y - location.coordinates[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 40) {
        onLocationClick(location);
        break;
      }
    }
  };

  // Handle mouse move for hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hovered: string | null = null;

    for (const location of mapData.locations) {
      if (!location.unlocked && mapData.fog_of_war.includes(location.id)) continue;

      const dx = x - location.coordinates[0];
      const dy = y - location.coordinates[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 40) {
        hovered = location.id;
        break;
      }
    }

    setHoveredLocation(hovered);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Karma Coins HUD */}
      <div className="bg-primary/20 border-2 border-primary px-6 py-3 flex items-center gap-3">
        <Coins className="w-6 h-6 text-primary" />
        <div className="text-center">
          <p className="text-primary text-xs pixel-text">KARMA COINS</p>
          <p className="text-primary text-2xl pixel-text font-bold">
            {mapData.karma_coins}
          </p>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative border-4 border-primary bg-background">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className="block"
        />
        
        {/* Legend */}
        <div className="absolute top-2 left-2 bg-background/90 border-2 border-border p-2 space-y-1">
          <p className="text-[10px] pixel-text text-primary">MAP LEGEND:</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FFA500]"></div>
            <p className="text-[8px] pixel-text text-foreground">New Location</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#4CAF50]"></div>
            <p className="text-[8px] pixel-text text-foreground">Visited</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-muted-foreground text-xs pixel-text max-w-md text-center">
        Click on locations to explore! Earn karma coins through interactions.
        {mapData.karma_coins >= 50 && (
          <span className="text-accent"> You can redeem coins for discounts!</span>
        )}
      </p>
    </div>
  );
};
