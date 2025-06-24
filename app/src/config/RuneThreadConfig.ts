import { NumberTileId } from '../../../rules/src/material/NumberTileId'

// ====================================
// SUMMONING LOOMS - RUNE THREAD CONFIG
// ====================================
// 
// 🔮 Easy Configuration for Rune Thread Names & Styling
// 
// Want to change the mystical thread names? Edit them here!
// Each number (0-9) gets its own mystical rune thread identity.
//
// 🌟 SACRED PATH (Sums of 3): Golden/divine colors work best
// ⚡ FREEDOM PATH (Sums of 5): Green/teal colors work best  
// 🔥 CURSED PATH (Sums of 7): Red/dark colors work best
// ====================================

export interface RuneThreadData {
  name: string
  primary: string      // Main thread color
  secondary: string    // Highlight/gradient color
  accent: string       // Border/stitching color
  pattern: string      // Weaving pattern name
  isSpecial: boolean   // Special runes (0 and 9)
  textureFile: string  // Future: texture file name
}

// 🧵 MYSTICAL RUNE THREAD IDENTITIES 🧵
export const RUNE_THREAD_CONFIG: Record<NumberTileId, RuneThreadData> = {
  
  // === SPECIAL THREADS ===
  [NumberTileId.Zero]: {
    name: 'Wyrd Stone',           // 🔮 The void, fate, destiny
    primary: '#E8E8E8',          // Light gray (neutral, void)
    secondary: '#F5F5F5',        // Bright white (potential)
    accent: '#4A5D23',           // Forest green border
    pattern: 'ancient',
    isSpecial: true,
    textureFile: 'wyrd-stone-ancient.png'
  },
  
  [NumberTileId.Nine]: {
    name: 'Norse Gold',           // ⚡ Divine completion, Odin's treasure
    primary: '#B8860B',          // Rich gold
    secondary: '#DAA520',        // Bright gold
    accent: '#4A5D23',           // Forest green border
    pattern: 'divine',
    isSpecial: true,
    textureFile: 'norse-gold-divine.png'
  },

  // === SACRED PATH THREADS (Good for Sums of 3) ===
  [NumberTileId.Three]: {
    name: 'Sacred Gold',          // 🌟 Divine blessing, Odin's wisdom
    primary: '#DAA520',          // Golden rod
    secondary: '#FFD700',        // Pure gold
    accent: '#4A5D23',           // Forest green border
    pattern: 'blessed',
    isSpecial: false,
    textureFile: 'sacred-gold-blessed.png'
  },

  // === FREEDOM PATH THREADS (Good for Sums of 5) ===
  [NumberTileId.One]: {
    name: 'Forest Hemp',          // 🌲 Natural beginnings, earth magic
    primary: '#2E8B57',          // Sea green
    secondary: '#3CB371',        // Medium sea green
    accent: '#4A5D23',           // Forest green border
    pattern: 'runic',
    isSpecial: false,
    textureFile: 'forest-hemp-runic.png'
  },

  [NumberTileId.Two]: {
    name: 'Sage Loom',           // 🧙‍♂️ Wisdom, ancient knowledge
    primary: '#87CEEB',          // Sky blue
    secondary: '#6495ED',        // Cornflower blue
    accent: '#4A5D23',           // Forest green border
    pattern: 'woven',
    isSpecial: false,
    textureFile: 'sage-loom-woven.png'
  },

  [NumberTileId.Five]: {
    name: 'Freedom Teal',        // ⚡ Liberation, free spirit
    primary: '#20B2AA',          // Light sea green
    secondary: '#48D1CC',        // Medium turquoise
    accent: '#4A5D23',           // Forest green border
    pattern: 'flowing',
    isSpecial: false,
    textureFile: 'freedom-teal-flowing.png'
  },

  // === NEUTRAL/EARTH THREADS ===
  [NumberTileId.Four]: {
    name: 'Ember Thread',        // 🔥 Fire, warmth, hearth magic
    primary: '#CD853F',          // Peru brown
    secondary: '#D2691E',        // Chocolate
    accent: '#4A5D23',           // Forest green border
    pattern: 'flickering',
    isSpecial: false,
    textureFile: 'ember-thread-flickering.png'
  },

  [NumberTileId.Six]: {
    name: 'Deep Myst',           // 🌀 Mystery, hidden knowledge
    primary: '#4682B4',          // Steel blue
    secondary: '#6495ED',        // Cornflower blue
    accent: '#4A5D23',           // Forest green border
    pattern: 'mystical',
    isSpecial: false,
    textureFile: 'deep-myst-mystical.png'
  },

  [NumberTileId.Eight]: {
    name: 'Earth Rune',          // 🌍 Grounding, stability, Midgard
    primary: '#8B7355',          // Gray brown
    secondary: '#A0522D',        // Sienna
    accent: '#4A5D23',           // Forest green border
    pattern: 'grounded',
    isSpecial: false,
    textureFile: 'earth-rune-grounded.png'
  },

  // === CURSED PATH THREAD (Good for Sums of 7) ===
  [NumberTileId.Seven]: {
    name: 'Cursed Crimson',      // 🔥 Danger, destruction, Loki's influence
    primary: '#8B0000',          // Dark red
    secondary: '#DC143C',        // Crimson
    accent: '#2F2F2F',           // Dark gray border (more ominous)
    pattern: 'chaotic',
    isSpecial: false,
    textureFile: 'cursed-crimson-chaotic.png'
  }
}

// 🌑 DEFAULT/FALLBACK THREAD (for undefined tiles)
export const DEFAULT_THREAD: RuneThreadData = {
  name: 'Void Thread',           // ⚫ Unknown, empty, placeholder
  primary: '#2F2F2F',           // Dark gray
  secondary: '#404040',         // Lighter gray
  accent: '#4A5D23',            // Forest green border
  pattern: 'shadow',
  isSpecial: false,
  textureFile: 'void-thread-shadow.png'
}

// ====================================
// 🎨 QUICK RENAME SUGGESTIONS:
// ====================================
//
// NORSE/RUNIC THEMES:
// - Odin's Wisdom, Thor's Might, Freya's Beauty
// - Bifrost Thread, Yggdrasil Root, Valhalla Gold
// - Raven's Wing, Wolf's Howl, Dragon's Scale
//
// MAGICAL/MYSTICAL:
// - Starweave, Moonthread, Sunspun Gold
// - Phoenix Fire, Unicorn Hair, Dragon Silk
// - Crystal Thread, Mana Weave, Spell Strand
//
// NATURE/ELEMENTAL:
// - Storm Thread, Ocean Deep, Mountain Stone
// - Forest Whisper, Desert Wind, Glacier Blue
// - Ember Glow, Earth Root, Sky Weave
//
// ==================================== 