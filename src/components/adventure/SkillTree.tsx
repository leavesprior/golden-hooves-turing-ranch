'use client'

import React, { useState } from 'react'
import {
  SKILL_BRANCHES,
  canUnlockNode,
  getSkillNode,
  type SkillBranch,
  type SkillNode,
} from '@/app/adventure/data/skillTree'
import type { StatName } from '@/app/oregon-trail/characterContext'

interface SkillTreeProps {
  unlockedNodes: string[]
  playerLevel: number
  skillPoints: number
  onUnlockNode: (nodeId: string) => void
  onClose: () => void
}

const STAT_COLORS: Record<StatName, string> = {
  Shrewdness: '#a78bfa',
  Agility: '#60a5fa',
  Durability: '#f87171',
  Diplomacy: '#34d399',
  Luck: '#fbbf24',
  Expertise: '#fb923c',
}

function SkillNodeCard({
  node,
  isUnlocked,
  canUnlock: canUnlockStatus,
  skillPoints,
  onUnlock,
}: {
  node: SkillNode
  isUnlocked: boolean
  canUnlock: { canUnlock: boolean; reason?: string }
  skillPoints: number
  onUnlock: () => void
}) {
  const color = STAT_COLORS[node.stat]
  const active = isUnlocked || (canUnlockStatus.canUnlock && skillPoints > 0)

  return (
    <div
      className={`p-3 border-2 transition-all ${
        isUnlocked
          ? 'bg-[var(--pixel-bg-mid)]'
          : canUnlockStatus.canUnlock && skillPoints > 0
            ? 'bg-[var(--pixel-bg-dark)] hover:bg-[var(--pixel-bg-mid)] cursor-pointer'
            : 'bg-[var(--pixel-bg-dark)] opacity-40'
      }`}
      style={{
        borderColor: isUnlocked ? color : active ? `${color}80` : 'var(--pixel-ui-border)',
        boxShadow: isUnlocked ? `0 0 8px ${color}40` : 'none',
      }}
      onClick={() => {
        if (!isUnlocked && canUnlockStatus.canUnlock && skillPoints > 0) {
          onUnlock()
        }
      }}
    >
      {/* Tier indicator */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-1">
          {[1, 2, 3].map(t => (
            <div
              key={t}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: t <= node.tier
                  ? (isUnlocked ? color : `${color}60`)
                  : 'var(--pixel-bg-dark)',
                border: `1px solid ${color}40`,
              }}
            />
          ))}
        </div>
        <span className="font-[var(--font-pixel)] text-[8px]" style={{ color: isUnlocked ? color : 'var(--pixel-ui-text)' }}>
          Tier {node.tier}
        </span>
      </div>

      <h4 className="font-[var(--font-pixel)] text-[11px] mb-1" style={{ color: isUnlocked ? color : 'var(--pixel-ui-text)' }}>
        {isUnlocked ? '\u2605 ' : ''}{node.name}
      </h4>
      <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70 mb-1">
        {node.description}
      </p>
      {node.specialEffect && (
        <p className="font-[var(--font-pixel)] text-[8px] mt-1" style={{ color: `${color}cc` }}>
          {node.specialEffect}
        </p>
      )}
      {!isUnlocked && !canUnlockStatus.canUnlock && canUnlockStatus.reason && (
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)] mt-1">
          {canUnlockStatus.reason}
        </p>
      )}
      {!isUnlocked && canUnlockStatus.canUnlock && skillPoints > 0 && (
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-1 animate-pulse">
          Click to unlock (1 skill point)
        </p>
      )}
    </div>
  )
}

function BranchColumn({
  branch,
  unlockedNodes,
  playerLevel,
  skillPoints,
  onUnlockNode,
  isExpanded,
  onToggle,
}: {
  branch: SkillBranch
  unlockedNodes: string[]
  playerLevel: number
  skillPoints: number
  onUnlockNode: (nodeId: string) => void
  isExpanded: boolean
  onToggle: () => void
}) {
  const color = STAT_COLORS[branch.stat]
  const branchProgress = branch.nodes.filter(n => unlockedNodes.includes(n.id)).length

  return (
    <div className="border-2 border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)]">
      {/* Branch Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-[var(--pixel-bg-mid)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{branch.icon}</span>
          <div>
            <h3 className="font-[var(--font-pixel)] text-[11px]" style={{ color }}>
              {branch.name}
            </h3>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
              {branch.stat}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress dots */}
          <div className="flex gap-1">
            {branch.nodes.map((n, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border"
                style={{
                  backgroundColor: unlockedNodes.includes(n.id) ? color : 'transparent',
                  borderColor: color,
                }}
              />
            ))}
          </div>
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
            {isExpanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </button>

      {/* Branch Description */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60 mb-3">
            {branch.description}
          </p>
          {/* Skill Nodes */}
          {branch.nodes.map(node => (
            <SkillNodeCard
              key={node.id}
              node={node}
              isUnlocked={unlockedNodes.includes(node.id)}
              canUnlock={canUnlockNode(node.id, unlockedNodes, playerLevel)}
              skillPoints={skillPoints}
              onUnlock={() => onUnlockNode(node.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SkillTree({ unlockedNodes, playerLevel, skillPoints, onUnlockNode, onClose }: SkillTreeProps) {
  const [expandedBranch, setExpandedBranch] = useState<StatName | null>(null)

  const totalUnlocked = unlockedNodes.length
  const totalNodes = SKILL_BRANCHES.reduce((sum, b) => sum + b.nodes.length, 0)

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[var(--pixel-bg-mid)] border-b-4 border-[var(--pixel-ui-border)] p-4 flex justify-between items-center">
          <div>
            <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
              SKILL TREE
            </h2>
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
              {totalUnlocked} / {totalNodes} skills unlocked | Level {playerLevel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {skillPoints > 0 && (
              <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] animate-pulse">
                {skillPoints} point{skillPoints !== 1 ? 's' : ''} available
              </span>
            )}
            <button
              onClick={onClose}
              className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-fire-orange)] px-2"
            >
              X
            </button>
          </div>
        </div>

        {/* Branches */}
        <div className="p-4 space-y-2">
          {SKILL_BRANCHES.map(branch => (
            <BranchColumn
              key={branch.stat}
              branch={branch}
              unlockedNodes={unlockedNodes}
              playerLevel={playerLevel}
              skillPoints={skillPoints}
              onUnlockNode={onUnlockNode}
              isExpanded={expandedBranch === branch.stat}
              onToggle={() => setExpandedBranch(
                expandedBranch === branch.stat ? null : branch.stat
              )}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t border-[var(--pixel-ui-border)]">
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center opacity-50">
            Each skill point unlocks one node. Higher tiers require their prerequisite.
            You cannot master everything — choose wisely.
          </p>
        </div>
      </div>
    </div>
  )
}
