'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'

// ===================== TYPES =====================

interface DeviceInfo {
  name: string
  role: string
  vpn_ip: string
  node_type: string
}

interface BootstrapResponse {
  ok: boolean
  name: string
  role: string
  vpn_ip: string
  node_type: string
  platform: string
  bootstrap: string
  filename: string
  error?: string
}

type Phase = 'loading' | 'denied' | 'boot' | 'scan' | 'select' | 'linking' | 'complete'

// ===================== MECH SVG =====================

function MechSVG({ powered, variant, open }: { powered: boolean; variant: 'node' | 'observer' | 'idle'; open: boolean }) {
  const visorColor = powered ? (variant === 'node' ? '#33ff33' : variant === 'observer' ? '#ffaa00' : '#33ff33') : '#1a1a1a'
  const reactorColor = powered ? '#33ff33' : '#0a0a0a'
  const bodyColor = variant === 'node' ? '#2a3a2a' : variant === 'observer' ? '#3a3a2a' : '#1a2a1a'

  return (
    <svg viewBox="0 0 300 400" className="mech-svg" style={{ width: '100%', maxWidth: 280 }}>
      {/* Head */}
      <rect x="100" y="20" width="100" height="70" rx="8" fill={bodyColor} stroke="#33ff33" strokeWidth="1.5"
        className={powered ? 'mech-glow' : ''} />
      {/* Visor */}
      <rect x="115" y="35" width="70" height="25" rx="4" fill={visorColor} opacity={powered ? 1 : 0.2}
        className={powered ? 'visor-pulse' : ''} />
      {/* Visor scan line */}
      {powered && <rect x="115" y="35" width="70" height="2" fill="#66ff66" className="scan-line" />}

      {/* Antenna */}
      <line x1="150" y1="10" x2="150" y2="20" stroke="#33ff33" strokeWidth="2" />
      <circle cx="150" cy="8" r="3" fill={powered ? '#33ff33' : '#1a1a1a'} className={powered ? 'antenna-blink' : ''} />

      {/* Neck */}
      <rect x="130" y="90" width="40" height="15" fill="#1a2a1a" stroke="#33ff33" strokeWidth="0.5" />

      {/* Torso */}
      <path d={open
        ? "M 80 105 L 220 105 L 230 250 L 200 250 L 200 180 L 100 180 L 100 250 L 70 250 Z"
        : "M 80 105 L 220 105 L 230 250 L 70 250 Z"
      } fill={bodyColor} stroke="#33ff33" strokeWidth="1.5" className={open ? 'torso-open' : ''} />

      {/* Reactor core */}
      <circle cx="150" cy="160" r={open ? 8 : 20} fill={reactorColor}
        className={powered ? 'reactor-pulse' : ''} />
      {powered && !open && <>
        <circle cx="150" cy="160" r="25" fill="none" stroke="#33ff33" strokeWidth="0.5" opacity="0.3" className="reactor-ring" />
        <circle cx="150" cy="160" r="30" fill="none" stroke="#33ff33" strokeWidth="0.3" opacity="0.2" className="reactor-ring-outer" />
      </>}

      {/* Diagnostic panels */}
      {powered && !open && <>
        <rect x="95" y="120" width="30" height="8" rx="2" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.5" className="panel-1" />
        <rect x="175" y="120" width="30" height="8" rx="2" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.5" className="panel-2" />
        <rect x="95" y="200" width="30" height="8" rx="2" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.5" className="panel-3" />
        <rect x="175" y="200" width="30" height="8" rx="2" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.5" className="panel-4" />

        {/* Status bars */}
        <rect x="95" y="122" width="0" height="4" fill="#33ff33" className="bar-fill-1" />
        <rect x="175" y="122" width="0" height="4" fill="#33ff33" className="bar-fill-2" />
        <rect x="95" y="202" width="0" height="4" fill="#ffaa00" className="bar-fill-3" />
        <rect x="175" y="202" width="0" height="4" fill="#33ff33" className="bar-fill-4" />
      </>}

      {/* Arms */}
      <path d="M 80 115 L 50 150 L 45 220 L 55 225 L 60 160 L 80 135" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />
      <path d="M 220 115 L 250 150 L 255 220 L 245 225 L 240 160 L 220 135" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />

      {/* Hands */}
      <rect x="40" y="220" width="20" height="15" rx="3" fill={bodyColor} stroke="#33ff33" strokeWidth="0.8" />
      <rect x="240" y="220" width="20" height="15" rx="3" fill={bodyColor} stroke="#33ff33" strokeWidth="0.8" />

      {/* Legs */}
      <rect x="90" y="250" width="45" height="80" rx="4" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />
      <rect x="165" y="250" width="45" height="80" rx="4" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />

      {/* Knee joints */}
      <circle cx="112" cy="290" r="6" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.8" />
      <circle cx="188" cy="290" r="6" fill="#0a1a0a" stroke="#33ff33" strokeWidth="0.8" />

      {/* Feet */}
      <rect x="80" y="330" width="65" height="20" rx="4" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />
      <rect x="155" y="330" width="65" height="20" rx="4" fill={bodyColor} stroke="#33ff33" strokeWidth="1" />

      {/* Node-specific: heavy shoulder plates */}
      {variant === 'node' && powered && <>
        <path d="M 70 105 L 40 115 L 45 130 L 80 120" fill="#2a3a2a" stroke="#33ff33" strokeWidth="1" />
        <path d="M 230 105 L 260 115 L 255 130 L 220 120" fill="#2a3a2a" stroke="#33ff33" strokeWidth="1" />
      </>}

      {/* Observer-specific: antenna array */}
      {variant === 'observer' && powered && <>
        <line x1="120" y1="20" x2="110" y2="5" stroke="#ffaa00" strokeWidth="1" />
        <line x1="180" y1="20" x2="190" y2="5" stroke="#ffaa00" strokeWidth="1" />
        <circle cx="110" cy="4" r="2" fill="#ffaa00" className="antenna-blink" />
        <circle cx="190" cy="4" r="2" fill="#ffaa00" className="antenna-blink" />
      </>}

      {/* Open state: download area inside torso */}
      {open && <>
        <rect x="110" y="190" width="80" height="50" rx="4" fill="#0a1a0a" stroke="#33ff33" strokeWidth="1" className="download-area" />
        <text x="150" y="210" textAnchor="middle" fill="#33ff33" fontSize="8" fontFamily="monospace">PAYLOAD</text>
        <text x="150" y="225" textAnchor="middle" fill="#33ff33" fontSize="8" fontFamily="monospace">READY</text>
        <rect x="125" y="230" width="50" height="3" fill="#33ff33" className="download-bar" />
      </>}
    </svg>
  )
}

// ===================== CRT EFFECTS =====================

function CRTOverlay() {
  return (
    <>
      <div className="scanlines" />
      <div className="vignette" />
    </>
  )
}

// ===================== TYPED TEXT =====================

function TypedText({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const timer = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1))
        idx.current++
      } else {
        clearInterval(timer)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed, onDone])

  return <span>{displayed}<span className="cursor-blink">_</span></span>
}

// ===================== BOOT SEQUENCE =====================

function BootSequence({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<{ text: string; color?: string }[]>([])
  const [currentLine, setCurrentLine] = useState(0)

  const bootLines = [
    { text: 'ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL', color: '#33ff33' },
    { text: 'NEOMA WORKSHOP v2.2.77', color: '#33ff33' },
    { text: '' },
    { text: 'MECH BAY: INITIALIZING...' },
    { text: 'POWER CORE............ [OK]', color: '#33ff33' },
    { text: 'SERVO ACTUATORS....... [OK]', color: '#33ff33' },
    { text: 'NEURAL INTERFACE...... [OK]', color: '#33ff33' },
    { text: 'WIREGUARD TUNNEL...... [STANDBY]', color: '#ffaa00' },
    { text: 'MESH NETWORK.......... [READY]', color: '#33ff33' },
    { text: '' },
    { text: 'SYSTEMS NOMINAL. AWAITING OPERATOR.' },
  ]

  useEffect(() => {
    if (currentLine >= bootLines.length) {
      setTimeout(onDone, 800)
      return
    }
    const delay = bootLines[currentLine].text === '' ? 200 : 150 + Math.random() * 100
    const timer = setTimeout(() => {
      setLines(prev => [...prev, bootLines[currentLine]])
      setCurrentLine(prev => prev + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [currentLine, onDone])

  return (
    <div className="boot-sequence">
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.color || '#33ff33', minHeight: '1.4em' }}>
          {line.text}
        </div>
      ))}
      <span className="cursor-blink">_</span>
    </div>
  )
}

// ===================== SENSOR SCAN =====================

function SensorScan({ onDone }: { onDone: () => void }) {
  const [scanData, setScanData] = useState<{ label: string; value: string; filled: boolean }[]>([])
  const [currentScan, setCurrentScan] = useState(0)

  useEffect(() => {
    const ua = navigator.userAgent
    const platform = /Windows/.test(ua) ? 'WINDOWS' : /Mac/.test(ua) ? 'MACOS' : /Linux/.test(ua) ? 'LINUX' : /Android/.test(ua) ? 'ANDROID' : /iPhone|iPad/.test(ua) ? 'IOS' : 'UNKNOWN'
    const screenRes = `${window.screen.width}x${window.screen.height}`
    const browser = /Chrome/.test(ua) ? 'CHROMIUM' : /Firefox/.test(ua) ? 'FIREFOX' : /Safari/.test(ua) ? 'WEBKIT' : 'UNKNOWN'
    const cores = navigator.hardwareConcurrency || 0
    const touch = navigator.maxTouchPoints > 0 ? 'YES' : 'NO'

    const scans = [
      { label: 'PLATFORM', value: platform, filled: false },
      { label: 'DISPLAY', value: screenRes, filled: false },
      { label: 'RENDERER', value: browser, filled: false },
      { label: 'CPU CORES', value: cores ? String(cores) : 'CLASSIFIED', filled: false },
      { label: 'TOUCH INPUT', value: touch, filled: false },
      { label: 'THREAT LEVEL', value: 'MINIMAL', filled: false },
    ]

    setScanData(scans)
  }, [])

  useEffect(() => {
    if (scanData.length === 0) return
    if (currentScan >= scanData.length) {
      setTimeout(onDone, 600)
      return
    }
    const timer = setTimeout(() => {
      setScanData(prev => prev.map((s, i) => i === currentScan ? { ...s, filled: true } : s))
      setCurrentScan(prev => prev + 1)
    }, 400)
    return () => clearTimeout(timer)
  }, [currentScan, scanData.length, onDone])

  return (
    <div className="sensor-scan">
      <div className="scan-header">{'>'} SENSOR SCAN IN PROGRESS</div>
      {scanData.map((scan, i) => (
        <div key={i} className={`scan-row ${scan.filled ? 'filled' : ''}`}>
          <span className="scan-label">{scan.label}:</span>
          <span className="scan-bar">
            <span className="scan-fill" style={{ width: scan.filled ? '100%' : '0%' }} />
          </span>
          <span className="scan-value">{scan.filled ? scan.value : '...'}</span>
        </div>
      ))}
    </div>
  )
}

// ===================== PARTICLES =====================

function GreenParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = []

    function spawn() {
      particles.push({
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.5 + Math.random() * 1.5),
        life: 1,
        size: 1 + Math.random() * 2,
      })
    }

    let animId: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (Math.random() > 0.7) spawn()

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.005

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.fillStyle = `rgba(51, 255, 51, ${p.life * 0.6})`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="particles-canvas" />
}

// ===================== DETECT PLATFORM =====================

function detectPlatform(): 'linux' | 'windows' | 'mobile' {
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile'
  if (/Windows/i.test(ua)) return 'windows'
  return 'linux'
}

// ===================== MAIN WORKSHOP COMPONENT =====================

function WorkshopContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('t')

  const [phase, setPhase] = useState<Phase>('loading')
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [selectedRole, setSelectedRole] = useState<'node' | 'observer' | null>(null)
  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(null)
  const [error, setError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setPhase('denied')
      return
    }

    if (!/^[a-f0-9]{32,64}$/.test(token)) {
      setPhase('denied')
      return
    }

    // Scrub token from URL bar to prevent leakage via history/referrer
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/neoma/workshop')
    }

    fetch(`/api/neoma/onboard?t=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setDeviceInfo(data)
          setPhase('boot')
        } else {
          setError(data.error || 'Invalid token')
          setPhase('denied')
        }
      })
      .catch(() => {
        setError('Connection failed')
        setPhase('denied')
      })
  }, [token])

  const handleBootDone = useCallback(() => setPhase('scan'), [])
  const handleScanDone = useCallback(() => {
    // M4: Auto-select the server-assigned role
    if (deviceInfo?.role === 'node' || deviceInfo?.role === 'observer') {
      setSelectedRole(deviceInfo.role)
    }
    setPhase('select')
  }, [deviceInfo])

  const handleInitiateLink = useCallback(async () => {
    if (!token || !selectedRole) return
    setPhase('linking')

    try {
      const platform = detectPlatform()
      const res = await fetch('/api/neoma/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform }),
      })
      const data: BootstrapResponse = await res.json()

      if (data.ok) {
        setBootstrapData(data)
        setTimeout(() => setPhase('complete'), 2000)
      } else {
        setError(data.error || 'Onboarding failed')
        setPhase('denied')
      }
    } catch {
      setError('Connection lost during onboarding')
      setPhase('denied')
    }
  }, [token, selectedRole])

  const handleDownload = useCallback(() => {
    if (!bootstrapData) return
    const blob = new Blob([bootstrapData.bootstrap], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = bootstrapData.filename
    a.click()
    URL.revokeObjectURL(url)
  }, [bootstrapData])

  return (
    <div className="workshop">
      <CRTOverlay />
      <GreenParticles />

      <div className="workshop-content">
        {/* DENIED */}
        {phase === 'denied' && (
          <div className="denied-screen">
            <div className="denied-static" />
            <div className="denied-text">
              <div className="flicker">CONNECTION REFUSED</div>
              <div className="denied-sub">AUTHORIZATION REQUIRED</div>
              {error && <div className="denied-error">{error}</div>}
              <div className="denied-code">ERR::AUTH_FAILED::0x42</div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div className="loading-screen">
            <div className="loading-text">ESTABLISHING SECURE CHANNEL...</div>
            <div className="loading-bar"><div className="loading-fill" /></div>
          </div>
        )}

        {/* BOOT SEQUENCE */}
        {phase === 'boot' && (
          <div className="boot-screen">
            <div className="mech-container">
              <MechSVG powered={false} variant="idle" open={false} />
            </div>
            <BootSequence onDone={handleBootDone} />
          </div>
        )}

        {/* SENSOR SCAN */}
        {phase === 'scan' && (
          <div className="scan-screen">
            <div className="mech-container">
              <MechSVG powered={true} variant="idle" open={false} />
            </div>
            <SensorScan onDone={handleScanDone} />
          </div>
        )}

        {/* ROLE DISPLAY — M4: role is server-assigned, show it instead of letting user pick */}
        {phase === 'select' && deviceInfo && (
          <div className="select-screen">
            <div className="select-header">
              <TypedText text={`OPERATOR: ${deviceInfo.name} — INTEGRATION MODE ASSIGNED`} speed={25} />
            </div>

            <div className="role-cards">
              <div
                className={`role-card ${deviceInfo.role === 'node' ? 'selected' : 'disabled'}`}
                onClick={deviceInfo.role === 'node' ? () => setSelectedRole('node') : undefined}
              >
                <div className="role-mech">
                  <MechSVG powered={deviceInfo.role === 'node'} variant="node" open={false} />
                </div>
                <div className="role-info">
                  <div className="role-title">[NODE] FULL MECH INTEGRATION</div>
                  <div className="role-desc">
                    Heavy armor. Full loadout. Shares compute, runs wheelwright tests,
                    full mesh participation. For trusted machines with resources to spare.
                  </div>
                  <div className="role-caps">
                    <span className="cap-badge cap-green">COMPUTE</span>
                    <span className="cap-badge cap-green">WHEELWRIGHT</span>
                    <span className="cap-badge cap-green">FULL MB ACCESS</span>
                  </div>
                  {deviceInfo.role === 'node' && <div className="role-assigned">ASSIGNED</div>}
                </div>
              </div>

              <div
                className={`role-card ${deviceInfo.role === 'observer' ? 'selected' : 'disabled'}`}
                onClick={deviceInfo.role === 'observer' ? () => setSelectedRole('observer') : undefined}
              >
                <div className="role-mech">
                  <MechSVG powered={deviceInfo.role === 'observer'} variant="observer" open={false} />
                </div>
                <div className="role-info">
                  <div className="role-title">[OBSERVER] RECON MODULE ONLY</div>
                  <div className="role-desc">
                    Scout armor. Light footprint. Read-only mesh access, monitor system health,
                    limited write to own namespaces. For phones and secondary devices.
                  </div>
                  <div className="role-caps">
                    <span className="cap-badge cap-amber">READ ONLY</span>
                    <span className="cap-badge cap-amber">MONITOR</span>
                    <span className="cap-badge cap-dim">NO COMPUTE</span>
                  </div>
                  {deviceInfo.role === 'observer' && <div className="role-assigned">ASSIGNED</div>}
                </div>
              </div>
            </div>

            {selectedRole && (
              <button className="initiate-btn" onClick={handleInitiateLink}>
                <span className="btn-text">INITIATE LINK</span>
                <span className="btn-glow" />
              </button>
            )}
          </div>
        )}

        {/* LINKING */}
        {phase === 'linking' && (
          <div className="linking-screen">
            <div className="mech-container">
              <MechSVG powered={true} variant={selectedRole || 'node'} open={false} />
            </div>
            <div className="linking-text">
              <TypedText text="ESTABLISHING WIREGUARD TUNNEL..." speed={40} />
            </div>
            <div className="linking-bar"><div className="linking-fill" /></div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === 'complete' && bootstrapData && (
          <div className="complete-screen">
            <div className="mech-container">
              <MechSVG powered={true} variant={selectedRole || 'node'} open={true} />
            </div>

            <div className="complete-header">
              <TypedText text="INTEGRATION COMPLETE — PAYLOAD READY" speed={25} />
            </div>

            <div className="complete-info">
              <div className="info-row"><span className="info-label">DEVICE:</span><span className="info-value">{bootstrapData.name}</span></div>
              <div className="info-row"><span className="info-label">ROLE:</span><span className="info-value">{bootstrapData.role.toUpperCase()}</span></div>
              <div className="info-row"><span className="info-label">VPN IP:</span><span className="info-value">{bootstrapData.vpn_ip}</span></div>
              <div className="info-row"><span className="info-label">PLATFORM:</span><span className="info-value">{bootstrapData.platform.toUpperCase()}</span></div>
            </div>

            <div className="download-section">
              {bootstrapData.platform === 'mobile' ? (
                <div className="mobile-instructions">
                  <div className="instruction-header">MOBILE DEPLOYMENT</div>
                  <ol className="instruction-steps">
                    <li>Open WireGuard app on your device</li>
                    <li>Tap &quot;+&quot; then &quot;Create from scratch&quot; or &quot;Import from file&quot;</li>
                    <li>Download config below and import it</li>
                    <li>Enable the tunnel</li>
                  </ol>
                  <button className="download-btn" onClick={handleDownload}>
                    DOWNLOAD wg-neoma.conf
                  </button>
                </div>
              ) : (
                <div className="desktop-instructions">
                  <div className="instruction-header">
                    {bootstrapData.platform === 'windows' ? 'WINDOWS DEPLOYMENT' : 'LINUX / MACOS DEPLOYMENT'}
                  </div>
                  <div className="instruction-cmd">
                    {bootstrapData.platform === 'windows'
                      ? '# Run in PowerShell as Administrator'
                      : '# Run in terminal:'
                    }
                  </div>
                  <div className="instruction-cmd highlight">
                    {bootstrapData.platform === 'windows'
                      ? `.\\${bootstrapData.filename}`
                      : `bash ${bootstrapData.filename}`
                    }
                  </div>
                  <button className="download-btn" onClick={handleDownload}>
                    DOWNLOAD {bootstrapData.filename}
                  </button>
                </div>
              )}
            </div>

            <div className="welcome-msg">
              <TypedText text="Welcome to the Neoma mesh, operator." speed={40} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .workshop {
          position: relative;
          min-height: 100vh;
          background: #0b0c0a;
          color: #33ff33;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          overflow: hidden;
        }

        /* CRT effects */
        .scanlines {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.15) 2px,
            rgba(0, 0, 0, 0.15) 4px
          );
          pointer-events: none;
          z-index: 100;
        }

        .vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 50%,
            rgba(0, 0, 0, 0.6) 100%
          );
          pointer-events: none;
          z-index: 99;
        }

        .particles-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .workshop-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Cursor blink */
        .cursor-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        /* Screen flicker */
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          3% { opacity: 0.7; }
          6% { opacity: 1; }
          7% { opacity: 0.8; }
          9% { opacity: 1; }
          50% { opacity: 0.95; }
          51% { opacity: 1; }
        }

        .flicker {
          animation: flicker 4s infinite;
        }

        /* ===== DENIED SCREEN ===== */
        .denied-screen {
          text-align: center;
          position: relative;
        }

        .denied-static {
          position: absolute;
          inset: -50px;
          background: repeating-linear-gradient(
            transparent 0px,
            rgba(51, 255, 51, 0.03) 1px,
            transparent 2px
          );
          animation: static-scroll 0.5s linear infinite;
          pointer-events: none;
        }

        @keyframes static-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .denied-text {
          font-size: 2rem;
          font-weight: bold;
          text-shadow: 0 0 20px rgba(51, 255, 51, 0.5);
        }

        .denied-sub {
          font-size: 1rem;
          margin-top: 16px;
          color: #ff3333;
          text-shadow: 0 0 10px rgba(255, 51, 51, 0.4);
        }

        .denied-error {
          font-size: 0.75rem;
          margin-top: 12px;
          color: #666;
        }

        .denied-code {
          font-size: 0.65rem;
          margin-top: 24px;
          color: #333;
        }

        /* ===== LOADING SCREEN ===== */
        .loading-screen {
          text-align: center;
        }

        .loading-text {
          font-size: 0.85rem;
          margin-bottom: 16px;
          letter-spacing: 0.1em;
        }

        .loading-bar {
          width: 300px;
          height: 4px;
          background: #1a1a1a;
          margin: 0 auto;
          border: 1px solid #33ff33;
        }

        .loading-fill {
          height: 100%;
          background: #33ff33;
          animation: load-fill 2s ease-out forwards;
        }

        @keyframes load-fill {
          0% { width: 0; }
          100% { width: 80%; }
        }

        /* ===== BOOT SCREEN ===== */
        .boot-screen, .scan-screen, .linking-screen {
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .mech-container {
          flex-shrink: 0;
          width: 200px;
        }

        .boot-sequence {
          font-size: 0.8rem;
          line-height: 1.6;
          flex: 1;
        }

        /* ===== SENSOR SCAN ===== */
        .sensor-scan {
          flex: 1;
        }

        .scan-header {
          font-size: 0.85rem;
          color: #ffaa00;
          margin-bottom: 16px;
          letter-spacing: 0.1em;
        }

        .scan-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #1a2a1a;
          font-size: 0.75rem;
        }

        .scan-label {
          width: 120px;
          color: #33ff33;
          flex-shrink: 0;
        }

        .scan-bar {
          flex: 1;
          height: 4px;
          background: #1a3a1a;
          position: relative;
          overflow: hidden;
          min-width: 40px;
        }

        .scan-fill {
          position: absolute;
          inset: 0;
          background: #33ff33;
          transition: width 0.3s ease;
        }

        .scan-row.filled .scan-fill {
          box-shadow: 0 0 8px rgba(51, 255, 51, 0.5);
        }

        .scan-value {
          width: 100px;
          text-align: right;
          color: #66ff66;
          font-weight: bold;
        }

        /* ===== SELECT SCREEN ===== */
        .select-screen {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .select-header {
          font-size: 0.85rem;
          text-align: center;
          color: #ffaa00;
          letter-spacing: 0.05em;
        }

        .role-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .role-card {
          background: #0d120d;
          border: 1px solid #1a2a1a;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .role-card:hover {
          border-color: #33ff33;
          box-shadow: 0 0 20px rgba(51, 255, 51, 0.15);
        }

        .role-card.selected {
          border-color: #33ff33;
          box-shadow: 0 0 30px rgba(51, 255, 51, 0.25), inset 0 0 30px rgba(51, 255, 51, 0.05);
        }

        .role-card.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        .role-card.disabled:hover {
          border-color: #1a2a1a;
          box-shadow: none;
        }

        .role-assigned {
          text-align: center;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #33ff33;
          border: 1px solid #33ff33;
          padding: 2px 12px;
          margin-top: 4px;
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .role-mech {
          width: 140px;
          margin: 0 auto;
        }

        .role-title {
          font-size: 0.85rem;
          font-weight: bold;
          color: #33ff33;
          text-align: center;
        }

        .role-desc {
          font-size: 0.7rem;
          color: #669966;
          line-height: 1.5;
        }

        .role-caps {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cap-badge {
          font-size: 0.55rem;
          padding: 2px 8px;
          border: 1px solid;
          letter-spacing: 0.1em;
        }

        .cap-green { border-color: #33ff33; color: #33ff33; }
        .cap-amber { border-color: #ffaa00; color: #ffaa00; }
        .cap-dim { border-color: #333; color: #444; }

        /* ===== INITIATE BUTTON ===== */
        .initiate-btn {
          position: relative;
          display: block;
          margin: 24px auto 0;
          padding: 12px 48px;
          background: transparent;
          border: 2px solid #33ff33;
          color: #33ff33;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: bold;
          letter-spacing: 0.15em;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .initiate-btn:hover {
          background: rgba(51, 255, 51, 0.1);
          box-shadow: 0 0 30px rgba(51, 255, 51, 0.3);
          text-shadow: 0 0 10px rgba(51, 255, 51, 0.5);
        }

        .btn-glow {
          position: absolute;
          inset: -2px;
          border: 2px solid #33ff33;
          animation: glow-pulse 2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; box-shadow: 0 0 10px rgba(51, 255, 51, 0.2); }
          50% { opacity: 1; box-shadow: 0 0 25px rgba(51, 255, 51, 0.5); }
        }

        /* ===== LINKING SCREEN ===== */
        .linking-text {
          font-size: 0.85rem;
          flex: 1;
        }

        .linking-bar {
          width: 100%;
          height: 4px;
          background: #1a1a1a;
          margin-top: 16px;
          border: 1px solid #33ff33;
        }

        .linking-fill {
          height: 100%;
          background: #33ff33;
          animation: link-fill 2s ease-out forwards;
          box-shadow: 0 0 10px rgba(51, 255, 51, 0.5);
        }

        @keyframes link-fill {
          0% { width: 0; }
          100% { width: 100%; }
        }

        /* ===== COMPLETE SCREEN ===== */
        .complete-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .complete-header {
          font-size: 1rem;
          color: #33ff33;
          text-align: center;
          text-shadow: 0 0 15px rgba(51, 255, 51, 0.4);
        }

        .complete-info {
          width: 100%;
          max-width: 400px;
          background: #0d120d;
          border: 1px solid #1a2a1a;
          padding: 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #0a1a0a;
          font-size: 0.75rem;
        }

        .info-label { color: #669966; }
        .info-value { color: #33ff33; font-weight: bold; }

        /* ===== DOWNLOAD ===== */
        .download-section {
          width: 100%;
          max-width: 500px;
          background: #0d120d;
          border: 1px solid #33ff33;
          padding: 20px;
          text-align: center;
        }

        .instruction-header {
          font-size: 0.85rem;
          color: #ffaa00;
          margin-bottom: 12px;
          letter-spacing: 0.1em;
        }

        .instruction-steps {
          text-align: left;
          font-size: 0.7rem;
          color: #669966;
          line-height: 1.8;
          padding-left: 20px;
          margin-bottom: 16px;
        }

        .instruction-cmd {
          font-size: 0.7rem;
          color: #669966;
          margin-bottom: 4px;
        }

        .instruction-cmd.highlight {
          color: #33ff33;
          font-size: 0.85rem;
          padding: 8px;
          background: #0a1a0a;
          margin-bottom: 16px;
        }

        .download-btn {
          padding: 10px 32px;
          background: transparent;
          border: 1px solid #33ff33;
          color: #33ff33;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          cursor: pointer;
          letter-spacing: 0.1em;
          transition: all 0.3s ease;
        }

        .download-btn:hover {
          background: rgba(51, 255, 51, 0.15);
          box-shadow: 0 0 20px rgba(51, 255, 51, 0.3);
        }

        .mobile-instructions {
          font-size: 0.75rem;
        }

        .desktop-instructions {
          font-size: 0.75rem;
        }

        .welcome-msg {
          margin-top: 24px;
          font-size: 0.9rem;
          text-align: center;
          color: #33ff33;
          text-shadow: 0 0 10px rgba(51, 255, 51, 0.3);
        }

        /* ===== MECH ANIMATIONS ===== */
        :global(.mech-glow) {
          filter: drop-shadow(0 0 8px rgba(51, 255, 51, 0.4));
        }

        :global(.visor-pulse) {
          animation: visor-glow 2s ease-in-out infinite;
        }

        @keyframes visor-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }

        :global(.scan-line) {
          animation: scan-move 2s linear infinite;
        }

        @keyframes scan-move {
          0% { y: 35; }
          100% { y: 58; }
        }

        :global(.antenna-blink) {
          animation: ant-blink 1.5s step-end infinite;
        }

        @keyframes ant-blink {
          0%, 40% { opacity: 1; }
          50%, 90% { opacity: 0.2; }
        }

        :global(.reactor-pulse) {
          animation: reactor-glow 1.5s ease-in-out infinite;
        }

        @keyframes reactor-glow {
          0%, 100% { filter: brightness(1); r: inherit; }
          50% { filter: brightness(1.5); }
        }

        :global(.reactor-ring) {
          animation: ring-expand 3s ease-in-out infinite;
        }

        :global(.reactor-ring-outer) {
          animation: ring-expand 3s ease-in-out infinite 0.5s;
        }

        @keyframes ring-expand {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }

        :global(.panel-1) { animation: panel-light 4s ease-in-out infinite 0s; }
        :global(.panel-2) { animation: panel-light 4s ease-in-out infinite 1s; }
        :global(.panel-3) { animation: panel-light 4s ease-in-out infinite 2s; }
        :global(.panel-4) { animation: panel-light 4s ease-in-out infinite 3s; }

        @keyframes panel-light {
          0%, 20%, 100% { fill: #0a1a0a; }
          10% { fill: #1a3a1a; }
        }

        :global(.bar-fill-1) { animation: bar-grow 3s ease-out 1s forwards; }
        :global(.bar-fill-2) { animation: bar-grow 3s ease-out 1.5s forwards; }
        :global(.bar-fill-3) { animation: bar-grow 3s ease-out 2s forwards; }
        :global(.bar-fill-4) { animation: bar-grow 3s ease-out 2.5s forwards; }

        @keyframes bar-grow {
          0% { width: 0; }
          100% { width: 28; }
        }

        :global(.torso-open) {
          transition: d 0.5s ease;
        }

        :global(.download-area) {
          animation: area-pulse 2s ease-in-out infinite;
        }

        @keyframes area-pulse {
          0%, 100% { stroke: #33ff33; }
          50% { stroke: #66ff66; filter: drop-shadow(0 0 5px rgba(51, 255, 51, 0.4)); }
        }

        :global(.download-bar) {
          animation: dbar-fill 1.5s ease-in-out infinite;
        }

        @keyframes dbar-fill {
          0% { width: 0; }
          50% { width: 50; }
          100% { width: 0; }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 700px) {
          .boot-screen, .scan-screen, .linking-screen {
            flex-direction: column;
            align-items: center;
          }

          .mech-container {
            width: 150px;
          }

          .role-cards {
            grid-template-columns: 1fr;
          }

          .denied-text {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  )
}

// ===================== PAGE EXPORT =====================

export default function WorkshopPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0b0c0a',
        color: '#33ff33',
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        INITIALIZING...
      </div>
    }>
      <WorkshopContent />
    </Suspense>
  )
}
