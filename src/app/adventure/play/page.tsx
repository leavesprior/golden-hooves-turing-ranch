'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { useRPG } from '@/lib/rpgContext'
import TileMap from '@/components/rpg/TileMap'
import DialogueBox from '@/components/rpg/DialogueBox'
import { getMapById, getDialogueById, chapters } from '@/lib/chapters'

// Controls overlay component - visible D-pad for clarity
function ControlsOverlay({ onMove, onInteract }: {
  onMove: (dir: 'up' | 'down' | 'left' | 'right') => void
  onInteract: () => void
}) {
  return (
    <div className="fixed bottom-4 left-4 z-40 select-none">
      <div className="bg-[var(--pixel-bg-dark)]/90 border-4 border-[var(--pixel-ui-border)] p-3 rounded-lg">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <div />
          <button
            onClick={() => onMove('up')}
            className="w-10 h-10 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-dark)] hover:border-[var(--pixel-gold-mid)] active:scale-95 transition-all flex items-center justify-center font-[var(--font-pixel)] text-[var(--pixel-ui-text)]"
          >
            ↑
          </button>
          <div />
          <button
            onClick={() => onMove('left')}
            className="w-10 h-10 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-dark)] hover:border-[var(--pixel-gold-mid)] active:scale-95 transition-all flex items-center justify-center font-[var(--font-pixel)] text-[var(--pixel-ui-text)]"
          >
            ←
          </button>
          <button
            onClick={onInteract}
            className="w-10 h-10 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-mid)] active:scale-95 transition-all flex items-center justify-center font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]"
          >
            ●
          </button>
          <button
            onClick={() => onMove('right')}
            className="w-10 h-10 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-dark)] hover:border-[var(--pixel-gold-mid)] active:scale-95 transition-all flex items-center justify-center font-[var(--font-pixel)] text-[var(--pixel-ui-text)]"
          >
            →
          </button>
          <div />
          <button
            onClick={() => onMove('down')}
            className="w-10 h-10 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-dark)] hover:border-[var(--pixel-gold-mid)] active:scale-95 transition-all flex items-center justify-center font-[var(--font-pixel)] text-[var(--pixel-ui-text)]"
          >
            ↓
          </button>
          <div />
        </div>

        {/* Labels */}
        <div className="text-center space-y-1">
          <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-gold-light)]">
            ARROW KEYS / TAP
          </p>
          <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)]">
            SPACE or ● to interact
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PlayPage() {
  const router = useRouter()
  const {
    session,
    phase,
    currentDialogue,
    startDialogue,
    closeDialogue,
    setPhase,
    saveGame,
    completeChapter,
    addScore,
    movePlayer,
    changeMap,
    setPosition,
  } = useRPG()

  const [showIntro, setShowIntro] = useState(true)
  const [showPuzzle, setShowPuzzle] = useState(false)

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.push('/adventure')
    }
  }, [session, router])

  // Show chapter intro on first load
  useEffect(() => {
    if (session && showIntro) {
      const introDialogue = getDialogueById(`ch${session.currentChapter}_intro`)
      if (introDialogue) {
        startDialogue(introDialogue)
        setShowIntro(false)
      }
    }
  }, [session, showIntro, startDialogue])

  // Auto-save periodically
  useEffect(() => {
    const interval = setInterval(saveGame, 30000)
    return () => clearInterval(interval)
  }, [saveGame])

  const handleInteract = useCallback((position: { x: number; y: number }, dialogueId: string) => {
    const dialogue = getDialogueById(dialogueId)
    if (dialogue) {
      startDialogue(dialogue)
    }
  }, [startDialogue])

  const handleDialogueClose = useCallback(() => {
    closeDialogue()
  }, [closeDialogue])

  const handleCompletePuzzle = useCallback(() => {
    setShowPuzzle(false)
    addScore(100)
    // Could trigger completion dialogue
  }, [addScore])

  const handleCompleteChapter = useCallback(() => {
    if (!session) return
    const chapterScore = 200 + session.stats.wisdom * 10 + session.stats.trust * 10 + session.stats.luck * 10
    completeChapter(chapterScore)
    router.push('/adventure')
  }, [session, completeChapter, router])

  // Get currentMap for interaction handlers
  const currentMap = session ? getMapById(session.currentMap) : null

  // Handler for D-pad controls
  const handleControlMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (phase !== 'playing') return
    movePlayer(dir)
  }, [phase, movePlayer])

  // Handler for interact button on D-pad
  const handleControlInteract = useCallback(() => {
    if (!session || !currentMap) return
    const interaction = currentMap.interactionPoints.find(
      i => i.position.x === session.position.x && i.position.y === session.position.y
    )
    if (interaction) {
      const dialogue = getDialogueById(interaction.dialogueId)
      if (dialogue) {
        startDialogue(dialogue)
      }
    }
  }, [session, currentMap, startDialogue])

  // Handler for map exits - transition to new map
  const handleMapExit = useCallback((targetMapId: string, targetSpawn: { x: number; y: number }) => {
    const targetMap = getMapById(targetMapId)
    if (!targetMap || !session) return

    // Check if we're transitioning to a new chapter
    const currentChapterMaps = chapters[session.currentChapter]?.maps || []
    const isCurrentChapterMap = currentChapterMaps.includes(targetMapId)

    if (!isCurrentChapterMap) {
      // We're moving to a new chapter! Complete the current one first
      const chapterScore = 200 + session.stats.wisdom * 10 + session.stats.trust * 10 + session.stats.luck * 10
      completeChapter(chapterScore)

      // Show completion dialogue for current chapter
      const completionDialogue = getDialogueById(`ch${session.currentChapter}_complete`)
      if (completionDialogue) {
        startDialogue(completionDialogue)
      }
    }

    // Change to target map
    changeMap(targetMapId)
    setPosition(targetSpawn)
    // Save the game after map transition
    setTimeout(saveGame, 100)
  }, [session, changeMap, setPosition, saveGame, completeChapter, startDialogue])

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)] flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">Loading...</p>
      </div>
    )
  }

  const chapterMeta = chapters[session.currentChapter]

  if (!currentMap) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
        <PixelNavigation />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-fire-orange)]">
            Map not found: {session.currentMap}
          </p>
          <PixelButton href="/adventure" variant="gold" size="md">
            Return to Menu
          </PixelButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Chapter Header */}
        <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-3 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)]">
                Chapter {session.currentChapter}:
              </span>
              <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] ml-2">
                {chapterMeta?.title}
              </span>
            </div>
            <div className="flex gap-4">
              <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                Score: <span className="text-[var(--pixel-forest-light)]">{session.totalScore}</span>
              </span>
              <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                💎 {session.stats.wisdom} | 🤝 {session.stats.trust} | 🍀 {session.stats.luck}
              </span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2">
            <TileMap map={currentMap} onInteract={handleInteract} onExit={handleMapExit} />
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Inventory */}
            <PixelCard title="Inventory">
              {session.inventory.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {session.inventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-2 text-center"
                      title={item.description}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)] mt-1">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] text-center">
                  No items yet
                </p>
              )}
            </PixelCard>

            {/* Current Objective */}
            <PixelCard title="Objective">
              <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                {session.currentChapter === 1 && 'Explore the trail and reach the river crossing'}
                {session.currentChapter === 2 && 'Trade wisely and stake your claim'}
                {session.currentChapter === 3 && 'Find the secret gold vein'}
                {session.currentChapter === 4 && 'Build your ranch on the claim'}
                {session.currentChapter === 5 && 'Hide the treasure and leave clues'}
              </p>
            </PixelCard>

            {/* Actions */}
            <div className="space-y-2">
              <PixelButton onClick={saveGame} variant="green" size="sm">
                💾 Save Game
              </PixelButton>
              <PixelButton onClick={() => setShowPuzzle(true)} variant="blue" size="sm">
                🧩 Solve Puzzle
              </PixelButton>
              <PixelButton onClick={handleCompleteChapter} variant="gold" size="sm">
                ✅ Complete Chapter
              </PixelButton>
              <PixelButton href="/adventure" variant="orange" size="sm">
                ← Exit to Menu
              </PixelButton>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Overlay */}
      {phase === 'dialogue' && currentDialogue && (
        <DialogueBox node={currentDialogue} onClose={handleDialogueClose} />
      )}

      {/* Controls Overlay */}
      <ControlsOverlay onMove={handleControlMove} onInteract={handleControlInteract} />

      {/* Puzzle Modal */}
      {showPuzzle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-6 max-w-md w-full">
            <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm mb-4 text-center">
              {chapterMeta?.puzzleType === 'navigation' && 'Navigation Puzzle'}
              {chapterMeta?.puzzleType === 'trading' && 'Trading Puzzle'}
              {chapterMeta?.puzzleType === 'pattern' && 'Pattern Puzzle'}
              {chapterMeta?.puzzleType === 'memory' && 'Memory Puzzle'}
              {chapterMeta?.puzzleType === 'cipher' && 'Cipher Puzzle'}
            </h2>

            {/* Simple placeholder puzzle */}
            <div className="bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-4 mb-4">
              <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] text-center">
                {chapterMeta?.puzzleType === 'navigation' && (
                  <>
                    "From where the sun rises, walk three paces west.
                    <br />
                    Then turn to face the tallest peak,
                    <br />
                    And there you'll find what prospectors seek."
                    <br /><br />
                    Which direction should you go?
                  </>
                )}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={handleCompletePuzzle}
                  className="bg-[var(--pixel-forest-dark)] border-2 border-[var(--pixel-forest-mid)] p-3 font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-forest-mid)]"
                >
                  ⬆️ North
                </button>
                <button
                  onClick={() => {}}
                  className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-ui-border)]"
                >
                  ➡️ East
                </button>
                <button
                  onClick={() => {}}
                  className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-ui-border)]"
                >
                  ⬇️ South
                </button>
                <button
                  onClick={() => {}}
                  className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-ui-border)]"
                >
                  ⬅️ West
                </button>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <PixelButton onClick={() => setShowPuzzle(false)} variant="orange" size="sm">
                Close
              </PixelButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
