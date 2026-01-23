# The Prospector's Tale - Playtest Report

**Date:** 2026-01-21
**Tester:** Claude Code (Browser Automation)
**Version:** Current development build

---

## Executive Summary

The Prospector's Tale is a charming pixel-art adventure game with solid foundations. The character creation flow works well, and the underlying architecture (TileMap, chapter system, graphics tiers) is sophisticated. However, several improvements would enhance the player experience without losing the game's nostalgic feel.

---

## Issues Found

### 1. Landing Page Graphics (Priority: High)

**Current State:** Basic SVG polygon mountains with flat colors
**Issue:** Does not match the rich 64-bit aesthetic established elsewhere in the project
**Impact:** First impression doesn't convey the game's quality

**Recommendation:** Upgrade to layered parallax mountains with:
- Multiple depth layers (3-4 mountain ranges)
- Gradient skies with golden hour colors
- Animated dust particles or birds
- The ranch house as a focal element (matching the Airbnb property aesthetic)

### 2. Name Truncation Bug (Priority: Medium)

**Current State:** Entering "Prospector Pete" in Step 1 shows only "Prospector" in Step 2
**Location:** Character creation flow, name propagation between steps
**Impact:** Player confusion, loss of personalization

**Recommendation:** Debug the name state management in the character creation context. Check for:
- Input maxLength restrictions
- State update timing issues
- Form submission handling

### 3. Button Click Target Areas (Priority: Medium)

**Current State:** Some buttons have small clickable areas or compete with nearby elements
**Observed:** "Begin Adventure" button was difficult to target; hamburger menu intercepted clicks
**Impact:** Frustration, especially on mobile

**Recommendation:**
- Increase button padding and hit areas
- Add `pointer-events: none` to decorative elements near buttons
- Ensure z-index stacking is correct

### 4. Keyboard Navigation (Priority: Low)

**Current State:** Tab navigation works but requires many presses
**Impact:** Accessibility concerns

**Recommendation:**
- Add keyboard shortcuts (Enter to confirm, Escape to go back)
- Implement focus trapping in modals
- Add visible focus indicators

---

## Improvement Suggestions

### Visual Enhancements

#### 1. Landing Page Overhaul

Replace basic mountains with a scene showing:
```
┌─────────────────────────────────────────────────┐
│  ░░░▒▒▓▓ SUNSET SKY WITH GRADIENT ▓▓▒▒░░       │
│                                                 │
│     ▲▲▲  DISTANT PURPLE MOUNTAINS  ▲▲▲         │
│   ▲▲▲▲▲▲▲  MID-RANGE BLUE PEAKS  ▲▲▲▲▲▲       │
│ ▲▲▲▲▲▲▲▲▲▲  CLOSE GREEN HILLS  ▲▲▲▲▲▲▲▲▲     │
│                                                 │
│         🏠 RANCH HOUSE (FOCAL POINT)           │
│    ═══════ TRAIL LEADING TO HOUSE ═══════      │
│                                                 │
│           [ BEGIN YOUR JOURNEY ]               │
└─────────────────────────────────────────────────┘
```

CSS Implementation idea:
```css
.landing-background {
  background: linear-gradient(
    to bottom,
    #ff6b35 0%,    /* sunset orange */
    #f7c59f 30%,   /* golden */
    #87ceeb 60%,   /* sky blue */
    #2d5016 100%   /* forest green */
  );
}
```

#### 2. Chapter Transition Animations

Add brief animated transitions between chapters:
- Wagon wheels rolling
- Map unfurling
- Sepia tone fade effect

#### 3. Weather Effects

The TileMap already supports atmospheric effects. Expand to include:
- Dust storms in desert areas
- Rain during river crossings
- Snow in mountain passes
- Heat shimmer in summer

### Gameplay Enhancements

#### 1. Tutorial Hints

Add optional first-time-player hints:
- "Press SPACE to interact" when near an NPC
- "Use arrow keys or D-pad to move"
- "Check your inventory for clues"

#### 2. Save/Load Feedback

- Show auto-save indicator (spinning disk icon)
- Confirm manual saves with toast notification
- Display last save time in menu

#### 3. Objective Clarity

The current objective text is static. Consider:
- Breaking objectives into sub-tasks
- Showing progress (e.g., "Clues found: 2/5")
- Highlighting active objective on map

### Audio Suggestions (Future)

- Ambient western music (harmonica, acoustic guitar)
- UI sound effects (button clicks, page turns)
- Environmental sounds (wind, campfire, horse hooves)

---

## Architecture Observations

### Strengths

1. **Graphics Tier System** - The 4-bit to 32-bit progression is excellent
2. **Chapter Palettes** - Each chapter has distinct colors and atmosphere
3. **Fog of War** - Creates mystery and encourages exploration
4. **Skill Check System** - Fallout-style checks add meaningful choices
5. **Reputation System** - Faction standings affect gameplay

### Areas for Extension

1. **64-bit Tier** - The plan mentions this but it's not yet implemented
2. **Parallax Scrolling** - Would enhance depth perception
3. **Dynamic Time of Day** - Already in plan, would add immersion
4. **Particle Effects** - Weather, dust, sparkles for gold

---

## Recommended Priority

### Phase 1: Critical Fixes
1. Fix name truncation bug
2. Improve button hit areas
3. Add keyboard shortcuts

### Phase 2: Visual Upgrades
1. New landing page with ranch house scene
2. Implement 64-bit graphics tier
3. Add chapter transition animations

### Phase 3: Polish
1. Tutorial system
2. Save/load feedback
3. Audio integration

---

## Test Coverage Notes

- Character creation: Fully tested
- Gameplay loop: Requires session state (couldn't test directly)
- Shop system: Code reviewed, appears solid
- Dialogue system: Code reviewed, skill checks work
- Map navigation: Code reviewed, exit requirements functional

---

## Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| TileMap.tsx | 1682 | Comprehensive, well-structured |
| TownShop.tsx | 412 | Feature-complete with Easter eggs |
| WitnessDialogue.tsx | 346 | Branching dialogue works |
| play/page.tsx | 381 | Good structure, needs polish |

---

*Report generated by Claude Code playtest session*
