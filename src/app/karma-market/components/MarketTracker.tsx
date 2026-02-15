'use client'

import React, { useMemo } from 'react'
import { useMarket } from '../marketContext'
import type { PricePoint } from '../data/mandelbrotPricing'

/**
 * SVG price chart showing karma price history over the last 24 hours.
 * Western theme: amber/brown palette, pixel-art style dots.
 */
export function MarketTracker() {
  const { pricingState, currentPrices } = useMarket()
  const { priceHistory } = pricingState

  const chartWidth = 320
  const chartHeight = 160
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Y scale: 0 to 100 (price in neutral karma)
  const maxPrice = useMemo(() => {
    if (priceHistory.length === 0) return 100
    const max = Math.max(
      ...priceHistory.map(p => Math.max(p.goodPrice, p.badPrice)),
      currentPrices.good,
      currentPrices.bad
    )
    return Math.ceil(max / 10) * 10 + 10
  }, [priceHistory, currentPrices])

  const yScale = (value: number) => {
    return innerHeight - (value / maxPrice) * innerHeight
  }

  // Build path data from history
  const buildPath = (points: PricePoint[], accessor: (p: PricePoint) => number): string => {
    if (points.length === 0) return ''
    const step = innerWidth / Math.max(1, points.length - 1)
    return points
      .map((p, i) => {
        const x = i * step
        const y = yScale(accessor(p))
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const goodPath = buildPath(priceHistory, p => p.goodPrice)
  const badPath = buildPath(priceHistory, p => p.badPrice)

  // Y-axis grid lines
  const yTicks = useMemo(() => {
    const ticks: number[] = []
    const step = Math.max(10, Math.floor(maxPrice / 5))
    for (let i = 0; i <= maxPrice; i += step) {
      ticks.push(i)
    }
    return ticks
  }, [maxPrice])

  return (
    <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-amber-200 text-xs">Market Prices</h3>
        <div className="flex gap-3 text-[9px]">
          <span className="text-amber-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-amber-400 rounded-sm" />
            Good
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-red-400 rounded-sm" />
            Bad
          </span>
          <span className="text-yellow-300 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-yellow-300 rounded-sm" />
            Neutral
          </span>
        </div>
      </div>

      {/* Current prices */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-amber-900/40 rounded p-1.5">
          <div className="text-[9px] text-amber-400">Good Karma</div>
          <div className="font-pixel text-amber-200 text-sm">{currentPrices.good}</div>
          <div className="text-[8px] text-amber-500">neutral/unit</div>
        </div>
        <div className="bg-red-900/30 rounded p-1.5">
          <div className="text-[9px] text-red-400">Bad Karma</div>
          <div className="font-pixel text-red-200 text-sm">{currentPrices.bad}</div>
          <div className="text-[8px] text-red-500">neutral/unit</div>
        </div>
        <div className="bg-yellow-900/30 rounded p-1.5">
          <div className="text-[9px] text-yellow-300">Neutral</div>
          <div className="font-pixel text-yellow-200 text-sm">{currentPrices.neutral}</div>
          <div className="text-[8px] text-yellow-500">flat rate</div>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={innerWidth}
          height={innerHeight}
          fill="rgba(120, 53, 15, 0.2)"
          stroke="rgba(180, 83, 9, 0.3)"
          strokeWidth="1"
        />

        {/* Y-axis grid lines and labels */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={padding.top + yScale(tick)}
              x2={padding.left + innerWidth}
              y2={padding.top + yScale(tick)}
              stroke="rgba(180, 83, 9, 0.15)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 5}
              y={padding.top + yScale(tick) + 3}
              textAnchor="end"
              fill="rgba(251, 191, 36, 0.5)"
              fontSize="8"
              fontFamily="monospace"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Neutral baseline */}
        <line
          x1={padding.left}
          y1={padding.top + yScale(1)}
          x2={padding.left + innerWidth}
          y2={padding.top + yScale(1)}
          stroke="rgba(253, 224, 71, 0.4)"
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Data lines */}
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {goodPath && (
            <path d={goodPath} fill="none" stroke="#fbbf24" strokeWidth="2" />
          )}
          {badPath && (
            <path d={badPath} fill="none" stroke="#f87171" strokeWidth="2" />
          )}

          {/* Pixel-art dots for price points */}
          {priceHistory.slice(-20).map((p, i) => {
            const step = innerWidth / Math.max(1, priceHistory.length - 1)
            const startIdx = Math.max(0, priceHistory.length - 20)
            const x = (startIdx + i) * step
            return (
              <g key={i}>
                <rect
                  x={x - 2}
                  y={yScale(p.goodPrice) - 2}
                  width={4}
                  height={4}
                  fill="#fbbf24"
                />
                <rect
                  x={x - 2}
                  y={yScale(p.badPrice) - 2}
                  width={4}
                  height={4}
                  fill="#f87171"
                />
              </g>
            )
          })}
        </g>

        {/* X-axis label */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fill="rgba(251, 191, 36, 0.5)"
          fontSize="8"
          fontFamily="monospace"
        >
          {priceHistory.length > 0 ? 'Price History' : 'No trades yet'}
        </text>
      </svg>

      {/* Epoch info */}
      <div className="mt-2 text-[9px] text-amber-500 text-center">
        Epoch: {pricingState.goodUnitsPurchased + pricingState.badUnitsPurchased}/50 units
        {' | '}
        Resets in {Math.max(0, Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - pricingState.epochStart)) / 3600000))}h
      </div>
    </div>
  )
}
