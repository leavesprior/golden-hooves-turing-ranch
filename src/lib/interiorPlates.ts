/**
 * Painted 16:9 interior plates for Level 2 street fronts (Grok image
 * generation, style-matched to the Manus pixel-noir targets; prompts and
 * checks in public/images/interiors/manifest.json). A front with a plate shows
 * the picture first; its ASCII floor plan stays one tap away.
 */
export const INTERIOR_PLATE_IDS: readonly string[] = []

export function interiorPlateFor(frontId: string): string | null {
  return INTERIOR_PLATE_IDS.includes(frontId) ? `/images/interiors/${frontId}.jpg` : null
}
