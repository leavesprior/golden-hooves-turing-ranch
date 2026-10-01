// The emulator's "real world" for the Volcano demo take (emulator only; a real headset shows
// real passthrough and never loads this). To use Leif's own photo: replace
// public/backdrop/volcano.jpg with it (any size; a landscape, straight-on street view works
// best) and update `credit`. Nothing else changes.
export const BACKDROP = {
  src: './backdrop/volcano.jpg',
  // Where the photographed street stands, metres ahead of the emulated headset's start.
  wallDistance: 3.6,
  // Width the photo spans on that wall, metres. Height follows the photo's aspect.
  photoWidth: 13,
  // Height of the photo's bottom edge above the floor, metres (negative = below the floor).
  photoBottom: -1.6,
  credit:
    "Background: photo of Volcano, CA, 'Volcano, California (March 18, 2014) - Wooden buildings' by Sharon Hahn Darlin, CC BY 2.0, via Wikimedia Commons",
};
