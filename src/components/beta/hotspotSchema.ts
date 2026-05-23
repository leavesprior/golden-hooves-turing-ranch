export type SourceLayer = 'gold' | 'silver' | 'bronze'

export interface Hotspot {
  id: string
  position: { x: number; y: number } // scene units 0..1
  triggerRadius: number
  evidenceKey: string
  dialogueRef: string
  sourceLayer: SourceLayer
  // private - not rendered to player:
  designerLabel: string
  designerNote?: string
}
