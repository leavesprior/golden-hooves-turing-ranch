import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Location, MapOverview } from '@/services/mapService';
import { Coins } from 'lucide-react';

interface RanchMapPixiProps {
  mapData: MapOverview;
  onLocationClick: (location: Location) => void;
}

// 16-bit color palette (Shining Force II inspired)
const PALETTE = {
  sky: [0x87CEEB, 0x98D8C8, 0x6BA7CC],
  grass: [0x6B8E23, 0x7FA524, 0x5C7A1F],
  dirt: [0x8B7355, 0x9B8265, 0x7A6345],
  water: [0x4169E1, 0x5A7DB8, 0x6A9DD9],
  fence: [0x8B4513, 0xA0522D, 0x6B3410],
  highlight: 0xFFD700,
  visited: 0x4CAF50,
  unvisited: 0xFFA500,
  shadow: 0x000000,
};

export const RanchMapPixi = ({ mapData, onLocationClick }: RanchMapPixiProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });
  const locationSpritesRef = useRef<Map<string, Container>>(new Map());
  const timeRef = useRef(0);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 960);
      const maxHeight = Math.min(window.innerHeight - 200, 640);
      setCanvasSize({ width: maxWidth, height: maxHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Create Pixi application
      const app = new Application();
      await app.init({
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: 0x87CEEB,
        antialias: false, // Crisp pixel art
        resolution: window.devicePixelRatio || 1,
      });

      appRef.current = app;

      // Clear container and add canvas
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);
      }

      // Create layers
      const backgroundLayer = new Container();
      const locationsLayer = new Container();
      const effectsLayer = new Container();

      app.stage.addChild(backgroundLayer);
      app.stage.addChild(locationsLayer);
      app.stage.addChild(effectsLayer);

      // Draw 16-bit style background
      drawPixelArtBackground(app, backgroundLayer);

      // Draw locations
      drawLocations(app, locationsLayer, effectsLayer);

      // Animation loop
      app.ticker.add((ticker) => {
        timeRef.current += ticker.deltaTime * 0.016;
        animateEffects(effectsLayer, timeRef.current);
      });
    };

    init();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, [canvasSize.width, canvasSize.height]);

  // Update locations when map data changes
  useEffect(() => {
    if (appRef.current) {
      const locationsLayer = appRef.current.stage.children[1] as Container;
      const effectsLayer = appRef.current.stage.children[2] as Container;
      
      // Clear and redraw locations
      locationsLayer.removeChildren();
      drawLocations(appRef.current, locationsLayer, effectsLayer);
    }
  }, [mapData, hoveredLocation]);

  const drawPixelArtBackground = (app: Application, layer: Container) => {
    const { width, height } = canvasSize;

    // Sky gradient (top portion)
    const skyHeight = height * 0.4;
    for (let i = 0; i < skyHeight; i += 16) {
      const graphics = new Graphics();
      const progress = i / skyHeight;
      const color = lerpColor(PALETTE.sky[0], PALETTE.sky[1], progress);
      graphics.rect(0, i, width, 16);
      graphics.fill(color);
      layer.addChild(graphics);
    }

    // Grass tiles (16-bit style)
    for (let y = skyHeight; y < height; y += 16) {
      for (let x = 0; x < width; x += 16) {
        const graphics = new Graphics();
        // Checkerboard pattern for texture
        const variant = ((x / 16) + (y / 16)) % 2;
        const grassColor = variant === 0 ? PALETTE.grass[0] : PALETTE.grass[1];
        graphics.rect(x, y, 16, 16);
        graphics.fill(grassColor);
        
        // Add random darker pixels for detail
        if (Math.random() > 0.7) {
          graphics.rect(x + Math.random() * 8, y + Math.random() * 8, 2, 2);
          graphics.fill(PALETTE.grass[2]);
        }
        
        layer.addChild(graphics);
      }
    }

    // Dirt paths (connecting locations)
    const pathGraphics = new Graphics();
    pathGraphics.rect(0, height - 100, width, 40);
    pathGraphics.fill(PALETTE.dirt[0]);
    
    // Add texture to path
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = height - 100 + Math.random() * 40;
      pathGraphics.rect(x, y, 4, 4);
      pathGraphics.fill(PALETTE.dirt[Math.random() > 0.5 ? 1 : 2]);
    }
    
    layer.addChild(pathGraphics);

    // Fence (16-bit style wooden posts)
    for (let x = 0; x < width; x += 80) {
      const fencePost = new Graphics();
      fencePost.rect(x, height - 80, 8, 40);
      fencePost.fill(PALETTE.fence[0]);
      fencePost.rect(x, height - 85, 16, 5);
      fencePost.fill(PALETTE.fence[1]);
      layer.addChild(fencePost);
    }
  };

  const drawLocations = (app: Application, layer: Container, effectsLayer: Container) => {
    locationSpritesRef.current.clear();

    mapData.locations.forEach((location) => {
      // Skip locked locations with fog
      if (!location.unlocked && mapData.fog_of_war.includes(location.id)) {
        drawFoggedLocation(layer, location);
        return;
      }

      const container = new Container();
      container.x = location.coordinates[0];
      container.y = location.coordinates[1];

      const isVisited = mapData.visited_locations.includes(location.id);
      const isHovered = hoveredLocation === location.id;

      // Draw 16-bit style location sprite
      const locationSprite = drawLocationSprite(location, isVisited, isHovered);
      container.addChild(locationSprite);

      // Add glow effect for hovered locations
      if (isHovered) {
        const glowFilter = new filters.GlowFilter({
          color: PALETTE.highlight,
          distance: 20,
          outerStrength: 2,
        });
        container.filters = [glowFilter];

        // Sparkle effect
        const sparkle = createSparkleEffect();
        sparkle.x = -50;
        sparkle.y = -50;
        container.addChild(sparkle);
      }

      // Location name text (pixel font style)
      const nameText = new Text({
        text: location.name,
        style: new TextStyle({
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 12,
          fill: 0xFFFFFF,
          stroke: { color: 0x000000, width: 3 },
          align: 'center',
        }),
      });
      nameText.anchor.set(0.5, 0);
      nameText.y = 60;
      container.addChild(nameText);

      // Make interactive
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.hitArea = new Graphics().circle(0, 0, 50).geometry;

      container.on('pointerdown', () => {
        onLocationClick(location);
      });

      container.on('pointerover', () => {
        setHoveredLocation(location.id);
      });

      container.on('pointerout', () => {
        setHoveredLocation(null);
      });

      layer.addChild(container);
      locationSpritesRef.current.set(location.id, container);
    });
  };

  const drawLocationSprite = (location: Location, isVisited: boolean, isHovered: boolean): Graphics => {
    const graphics = new Graphics();

    // Base circle (16-bit style with outline)
    const baseColor = isVisited ? PALETTE.visited : PALETTE.unvisited;
    
    // Outer shadow
    graphics.circle(0, 2, 36);
    graphics.fill({ color: PALETTE.shadow, alpha: 0.3 });

    // Main circle
    graphics.circle(0, 0, 36);
    graphics.fill(baseColor);

    // Highlight (top-left for 16-bit 3D effect)
    graphics.arc(0, 0, 36, -Math.PI * 0.8, -Math.PI * 0.4);
    graphics.fill({ color: 0xFFFFFF, alpha: 0.3 });

    // Border
    graphics.circle(0, 0, 36);
    graphics.stroke({ color: isHovered ? PALETTE.highlight : 0x333333, width: 3 });

    // Icon (simplified emoji as pixel art)
    const iconText = new Text({
      text: location.icon,
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
      }),
    });
    iconText.anchor.set(0.5);
    graphics.addChild(iconText);

    return graphics;
  };

  const drawFoggedLocation = (layer: Container, location: Location) => {
    const container = new Container();
    container.x = location.coordinates[0];
    container.y = location.coordinates[1];

    // Fog rectangle
    const fog = new Graphics();
    fog.rect(-40, -40, 80, 80);
    fog.fill({ color: PALETTE.shadow, alpha: 0.7 });
    container.addChild(fog);

    // "???" text
    const questionText = new Text({
      text: '???',
      style: new TextStyle({
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        fill: 0xFFFFFF,
      }),
    });
    questionText.anchor.set(0.5);
    container.addChild(questionText);

    layer.addChild(container);
  };

  const createSparkleEffect = (): Graphics => {
    const sparkle = new Graphics();
    sparkle.star(0, 0, 4, 10, 5);
    sparkle.fill(PALETTE.highlight);
    return sparkle;
  };

  const animateEffects = (layer: Container, time: number) => {
    // Animate sparkles and other effects
    layer.children.forEach((child, index) => {
      if (child instanceof Graphics) {
        child.rotation = time * 0.5 + index;
        child.alpha = 0.5 + Math.sin(time * 2 + index) * 0.5;
      }
    });
  };

  const lerpColor = (color1: number, color2: number, t: number): number => {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
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

      {/* PixiJS Map Container */}
      <div className="relative border-4 border-primary bg-background">
        <div ref={containerRef} className="block" />
        
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
