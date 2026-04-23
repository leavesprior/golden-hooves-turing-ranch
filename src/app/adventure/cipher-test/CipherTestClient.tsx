'use client'

import { useEffect, useState } from 'react'
import CipherAltar from '@/app/adventure/components/CipherAltar'
import {
  ARTIFACT_IDS,
  useAct5GateStore,
  type Act5State,
} from '@/lib/act5GateStore'

export default function CipherTestClient() {
  const state = useAct5GateStore((s) => s.state)
  const collected = useAct5GateStore((s) => s.collectedArtifacts)
  const collectArtifact = useAct5GateStore((s) => s.collectArtifact)
  const transition = useAct5GateStore((s) => s.transition)
  const reset = useAct5GateStore((s) => s.reset)

  const [log, setLog] = useState<string[]>([])

  // Seed the store on mount: collect all 4, move to ALTAR_ACTIVE.
  useEffect(() => {
    reset()
    ARTIFACT_IDS.forEach((id) => collectArtifact(id))
    transition('ALTAR_ACTIVE')
    setLog((l) => [...l, '[seed] 4 artifacts collected, state=ALTAR_ACTIVE'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCipherSolved = () => {
    transition('CIPHER_SOLVED')
    setLog((l) => [...l, '[event] onCipherSolved fired, state=CIPHER_SOLVED'])
    // Simulate the dawn-at-Templo-Mayor beat for the test page only.
    window.setTimeout(() => {
      transition('ACT5_UNLOCKED')
      setLog((l) => [...l, '[event] dawn tick, state=ACT5_UNLOCKED'])
    }, 1800)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, #0a0814 0%, #050308 65%, #000 100%)',
        color: '#f3ecd8',
        fontFamily: '"Press Start 2P", ui-monospace, monospace',
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <header style={{ textAlign: 'center', maxWidth: 640 }}>
        <h1 style={{ fontSize: 18, margin: 0, letterSpacing: '0.1em' }}>
          CIPHER ALTAR — DEV TEST
        </h1>
        <p
          style={{
            fontSize: 11,
            color: '#d4b97a',
            lineHeight: 1.6,
            marginTop: 8,
          }}
        >
          Golden Frog Codex / Act 5 cipher mechanism. Drag each artifact onto
          the altar heart, rotate to a multiple of 90°, release to snap. When
          all four are aligned, press COMBINE. Use "Show skeleton" to verify
          the congruent geometry hidden in every artifact.
        </p>
      </header>

      <CipherAltar artifacts={collected} onCipherSolved={onCipherSolved} />

      <section
        style={{
          width: 'min(520px, 92vw)',
          border: '1px solid #2a1f10',
          borderRadius: 6,
          padding: 12,
          background: 'rgba(0,0,0,0.4)',
          fontSize: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>state:</strong>
          <span style={{ color: '#ffd76a' }}>{state as Act5State}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>collected:</strong>
          <span style={{ color: '#ffd76a' }}>{collected.length} / 4</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>log:</strong>
          <ul style={{ paddingLeft: 16, marginTop: 4, color: '#c0a56a' }}>
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            ARTIFACT_IDS.forEach((id) => collectArtifact(id))
            transition('ALTAR_ACTIVE')
            setLog(['[seed] re-seeded, state=ALTAR_ACTIVE'])
          }}
          style={{
            marginTop: 12,
            font: 'inherit',
            fontSize: 10,
            padding: '6px 12px',
            background: '#2a1f10',
            color: '#f3ecd8',
            border: '1px solid #5a3a14',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          RESET
        </button>
      </section>
    </main>
  )
}
