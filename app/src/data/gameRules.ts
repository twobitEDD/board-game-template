// Game Rules Data Structure
// This file contains all the rules for SUMMON5 in an easily editable format

export interface RuleSection {
  id: string
  title: string
  content: string[]
  examples?: RuleExample[]
  notes?: string[]
}

export interface RuleExample {
  description: string
  setup?: string
  result: string
  points?: number
}

export interface GameRulesData {
  title: string
  subtitle: string
  version: string
  lastUpdated: string
  sacredNumber: number
  handSize: number
  sections: RuleSection[]
}

export const gameRules: GameRulesData = {
  title: "SUMMON5",
  subtitle: "Ancient Mathematical Weaving Arts",
  version: "1.0",
  lastUpdated: "2024-12-19",
  sacredNumber: 5, // Configurable target number
  handSize: 5, // Configurable hand size (Thread Reservoir capacity)
  
  sections: [
    {
      id: "overview",
      title: "The Ancient Art",
      content: [
        "In the mystical realm of SUMMON5, players are Wyrd-Weavers who channel mathematical energy through sacred number patterns.",
        "Using Rune Threads (numbered tiles 0-9), weavers place tiles on The Great Loom to form sequences that sum to multiples of the Sacred Number.",
        "The Sacred Number is currently set to 5, but ancient texts speak of other mystical numbers (3, 7) used by different schools of magic."
      ]
    },
    
    {
      id: "components",
      title: "Sacred Components",
      content: [
        "The Great Loom: A 15×15 mystical grid where patterns are woven",
        "Rune Threads: 40 numbered tiles (4 each of numbers 0-9)",
        "Thread Reservoir: Each player's hand (holds up to 7 tiles)",
        "Personal Draw Pile: Each player's remaining tiles",
        "Center Anchor: Tile 5 placed at the heart of The Great Loom (position 7,7)"
      ]
    },
    
    {
      id: "setup",
      title: "Preparing the Ritual",
      content: [
        "Shuffle all 40 Rune Threads together",
        "Deal tiles to each player's Thread Reservoir (hand) - default 5 tiles",
        "Distribute remaining tiles equally among players as Personal Draw Piles",
        "Place the Center Anchor (tile 5) at position (7,7) on The Great Loom",
        "The first player begins their Weaving Turn"
      ],
              notes: [
          "Unlike many games, each player has their own draw pile rather than a shared one",
          "Players start with the configured hand size (default 5) and try to maintain this throughout the game",
          "Hand size is configurable - original Game Park design used 7 tiles, current implementation uses 5"
        ]
    },
    
    {
      id: "turn-structure",
      title: "The Weaving Turn",
      content: [
        "Phase 1 - Weaving: Place one or more Rune Threads on The Great Loom",
        "Phase 2 - Manifestation: Calculate mystical energy from completed sequences", 
        "Phase 3 - Gathering: Draw tiles from your Personal Draw Pile to refill hand to 5",
        "Phase 4 - Passing: The weaving passes to the next player"
      ],
              examples: [
          {
            description: "Basic Turn",
            setup: "Player has tiles [2,3,4,1,7] in hand (5 tiles)",
            result: "Places tile 2 adjacent to existing tiles, forms sequence [3,2] = 5, scores 10 points, draws 1 tile"
          }
        ]
    },
    
    {
      id: "placement-rules",
      title: "Laws of Placement",
      content: [
        "Adjacency Law: New Rune Threads must touch existing threads horizontally or vertically (no diagonal)",
        "Boundary Law: All threads must remain within The Great Loom's 15×15 boundaries",
        "Occupation Law: Cannot place threads on spaces already occupied",
        "Contiguity Law: All threads placed in one turn must form a single straight line. Gaps between new threads are allowed if existing threads fill those gaps.",
        "Direction Law: In one turn, place threads in EITHER the same row OR the same column, never both"
      ],
      examples: [
        {
          description: "Valid Placement",
          setup: "Existing tile at (7,8), want to place at (7,9)",
          result: "Valid - adjacent and in same column"
        },
        {
          description: "Invalid Placement - Different Lines",
          setup: "Place tiles at (7,8) and (8,9) in same turn",
          result: "Invalid - not in same row or column"
        },
        {
          description: "Valid Placement - Gap Filled by Existing Tile",
          setup: "Existing tile at (7,9), place new tiles at (7,8) and (7,10) in same turn",
          result: "Valid - existing tile at (7,9) fills the gap between new tiles"
        },
        {
          description: "Invalid Placement - Unfilled Gap",
          setup: "No tile at (7,9), place tiles at (7,8) and (7,10) in same turn",
          result: "Invalid - gap at (7,9) breaks contiguity"
        }
      ]
    },
    
    {
      id: "first-move",
      title: "The First Weaving",
      content: [
        "The first player must place their first Rune Thread either:",
        "• Directly on the Center Anchor (replacing tile 5 at position 7,7), OR",
        "• Adjacent to the Center Anchor (horizontally or vertically touching position 7,7)",
        "This ensures all subsequent patterns connect to the mystical center of The Great Loom"
      ],
      examples: [
        {
          description: "Valid First Moves",
          result: "Place at (7,7), (6,7), (8,7), (7,6), or (7,8)"
        }
      ]
    },
    
    {
      id: "scoring",
      title: "Channeling Mystical Energy",
      content: [
        "Sequences are formed by 2-5 consecutive Rune Threads in the same row or column",
        "A sequence channels mystical energy only if its sum is a multiple of the Sacred Number",
        "Energy Formula: (Sequence Sum ÷ Sacred Number) × 10 = Mystical Energy Points",
        "Multiple sequences can be formed in one turn - each scores independently",
        "Cross-sequences: A single thread placement can complete both horizontal and vertical sequences"
      ],
      examples: [
        {
          description: "Basic Scoring (Sacred Number = 5)",
          setup: "Sequence [2,3] in same row",
          result: "Sum = 5, Score = (5÷5)×10 = 10 points"
        },
        {
          description: "Longer Sequence",
          setup: "Sequence [1,2,3,4] in same column", 
          result: "Sum = 10, Score = (10÷5)×10 = 20 points"
        },
        {
          description: "Invalid Sequence",
          setup: "Sequence [1,2,3] in same row",
          result: "Sum = 6, not multiple of 5, Score = 0 points"
        },
        {
          description: "Cross-Scoring",
          setup: "Place tile 4 that completes [1,4] horizontally and [2,4,4] vertically",
          result: "Horizontal: 5 points, Vertical: 10 points, Total: 15 points"
        }
      ]
    },
    
    {
      id: "validation",
      title: "The Sacred Laws of Validation",
      content: [
        "Turn Validation occurs when ending your turn - all rules must be satisfied:",
        "• At least one Rune Thread must be placed",
        "• All placed threads must follow Placement Laws",
        "• ALL sequences involving newly placed threads must sum to multiples of the Sacred Number",
        "• If any sequence is invalid, the entire turn is invalid and must be corrected"
      ],
      examples: [
        {
          description: "Invalid Turn Example",
          setup: "Place tiles creating sequences [2,3] (sum=5, valid) and [1,2,3] (sum=6, invalid)",
          result: "Turn rejected - must fix the invalid sequence or undo"
        }
      ],
      notes: [
        "You can click placed tiles during your turn to return them to your hand",
        "Use 'Undo Turn' to return all placed tiles and start over",
        "Only tiles placed THIS turn can be moved - previous tiles are permanent"
      ]
    },
    
    {
      id: "hand-management", 
      title: "Thread Reservoir Management",
      content: [
        "Your Thread Reservoir (hand) holds up to the configured number of Rune Threads (default 5)",
        "After placing threads and ending your turn, draw from your Personal Draw Pile to refill to maximum capacity",
        "If your Personal Draw Pile is empty, you cannot draw more threads",
        "Strategic hand management is crucial - save powerful threads for optimal placements"
      ]
    },
    
    {
      id: "game-end",
      title: "The Final Summoning",
      content: [
        "The game ends when ALL players have emptied both their Thread Reservoir AND Personal Draw Pile",
        "Victory goes to the Wyrd-Weaver with the most Mystical Energy (highest score)",
        "Tiebreaker: The weaver with fewer remaining threads wins",
        "Perfect Summoning: Completely emptying your threads grants additional mystical energy"
      ]
    },
    
    {
      id: "strategy",
      title: "Secrets of Master Weavers", 
      content: [
        "Efficient Weaving: Try to place threads that complete multiple sequences simultaneously",
        "Blocking Patterns: Prevent opponents from completing high-value sequences",
        "Sacred Number Mastery: Learn common combinations that sum to multiples of your Sacred Number",
        "Thread Conservation: Balance immediate scoring with saving powerful threads for bigger plays",
        "Positional Awareness: Control key board positions that enable future high-scoring placements"
      ],
      examples: [
        {
          description: "Sacred Number 5 - Key Combinations",
          result: "[0,5], [1,4], [2,3], [1,1,3], [2,2,1], [1,2,2], [0,2,3], [0,1,4], [0,0,5]"
        },
        {
          description: "High-Value Strategy",
          setup: "Save tiles 6,7,8,9 for sequences like [6,9] or [7,8]",
          result: "These create 15-point sequences (sum=15, 15÷5×10=30 points)"
        }
      ]
    },
    
    {
      id: "variants",
      title: "Ancient Variations",
      content: [
        "Sacred Number Variants: Change the target from 5 to other mystical numbers",
        "• Sacred 3: More frequent scoring, faster games",
        "• Sacred 7: Higher risk/reward, more challenging",
        "Board Variants: Smaller grids (11×11) for quicker rituals",
        "Scoring Variants: Progressive scoring where later sequences are worth more"
      ],
      notes: [
        "The current implementation uses Sacred Number 5",
        "Future updates may include selectable Sacred Numbers",
        "Advanced players often prefer Sacred Number 7 for its complexity"
      ]
    }
  ]
}

// Helper function to get rules for specific configuration
export function getRulesForConfiguration(sacredNumber: number, handSize?: number): GameRulesData {
  const modifiedRules = { ...gameRules }
  modifiedRules.sacredNumber = sacredNumber
  if (handSize !== undefined) {
    modifiedRules.handSize = handSize
  }
  
  // Update examples to reflect the new configuration
  modifiedRules.sections = modifiedRules.sections.map(section => ({
    ...section,
    examples: section.examples?.map(example => ({
      ...example,
      result: example.result.replace(/Sacred Number = \d+/g, `Sacred Number = ${sacredNumber}`)
    }))
  }))
  
  return modifiedRules
}

// Backward compatibility function
export function getRulesForSacredNumber(sacredNumber: number): GameRulesData {
  return getRulesForConfiguration(sacredNumber)
} 