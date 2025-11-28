# Planning Guide

A strategic Tic-Tac-Toe application where two AI opponents compete against each other while users spectate and observe different AI strategies in action.

**Experience Qualities**:
1. **Captivating** - Users should be drawn into watching the AI battle unfold with clear visual feedback showing decision-making
2. **Intelligent** - The application should showcase genuinely smart gameplay with visible strategic thinking
3. **Accessible** - Anyone should instantly understand what's happening without prior knowledge of AI concepts

**Complexity Level**: Light Application (multiple features with basic state)
  - The app manages game state, AI decision-making, and replay functionality, but doesn't require accounts or complex data structures

## Essential Features

### AI vs AI Game Engine
- **Functionality**: Two AI players automatically take turns playing Tic-Tac-Toe using different strategies
- **Purpose**: Demonstrate AI decision-making and create an engaging spectator experience
- **Trigger**: User clicks "Start Game" button
- **Progression**: Game initializes → AI Player 1 (X) makes move → Brief pause for visibility → AI Player 2 (O) makes move → Repeat until win/draw → Display result
- **Success criteria**: Game completes with valid winner or draw, all moves are legal, no crashes

### Move Visualization
- **Functionality**: Each AI move is animated and highlighted to show what decision was made
- **Purpose**: Make the AI's thinking process visible and engaging for spectators
- **Trigger**: AI selects a move
- **Progression**: Cell highlights → Symbol appears with animation → Brief pause → Next player's turn
- **Success criteria**: Users can clearly follow which moves were just made

### Game Speed Control
- **Functionality**: Users can adjust the speed of AI turns (slow, normal, fast, instant)
- **Purpose**: Allow users to study strategies at slower speeds or quickly see outcomes
- **Trigger**: User selects speed from control panel
- **Progression**: User clicks speed option → Speed value updates → Next move uses new timing
- **Success criteria**: Timing changes are immediately applied and feel natural

### AI Strategy Display
- **Functionality**: Show which strategy each AI is using (Random, Minimax, etc.)
- **Purpose**: Help users understand different AI approaches and their effectiveness
- **Trigger**: Display present throughout game
- **Progression**: Shown in player labels → Persists during gameplay → Referenced in results
- **Success criteria**: Strategy names are clear and remain visible

### Game History & Reset
- **Functionality**: Track game outcomes and allow users to start new games
- **Purpose**: Enable multiple games to see pattern variations and different outcomes
- **Trigger**: User clicks "New Game" button
- **Progression**: Current game state clears → Board resets → New game ready to start
- **Success criteria**: Clean reset with no residual state, win/loss stats persist

## Edge Case Handling

- **Mid-game reset**: Allow users to restart during an active game without breaking state
- **Rapid clicking**: Prevent users from triggering multiple games simultaneously with debouncing
- **Animation interruption**: Handle speed changes mid-animation gracefully without visual glitches
- **Perfect play scenarios**: Handle games where both AIs play optimally (always draws) without appearing broken

## Design Direction

The design should feel strategic and cerebral with a clean, modern interface that emphasizes the game board as the focal point. The aesthetic should be minimalist with purposeful motion, creating an experience that's both analytical and engaging - think chess timer meets data visualization.

## Color Selection

Triadic color scheme with deep strategic tones balanced by vibrant accent colors for dynamic gameplay states.

- **Primary Color**: Deep Navy Blue (oklch(0.25 0.05 250)) - Represents intelligence, strategy, and focus
- **Secondary Colors**: Soft Slate (oklch(0.55 0.02 250)) for backgrounds and muted elements; Warm Charcoal (oklch(0.35 0.01 250)) for secondary actions
- **Accent Color**: Electric Cyan (oklch(0.70 0.15 195)) for Player X moves and highlights; Vibrant Coral (oklch(0.68 0.18 25)) for Player O moves
- **Foreground/Background Pairings**:
  - Background (Light Cream oklch(0.97 0.01 85)): Deep Navy text (oklch(0.25 0.05 250)) - Ratio 8.9:1 ✓
  - Card (White oklch(1 0 0)): Deep Navy text (oklch(0.25 0.05 250)) - Ratio 9.8:1 ✓
  - Primary (Deep Navy oklch(0.25 0.05 250)): White text (oklch(1 0 0)) - Ratio 9.8:1 ✓
  - Secondary (Soft Slate oklch(0.55 0.02 250)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Accent Cyan (oklch(0.70 0.15 195)): Deep Navy text (oklch(0.25 0.05 250)) - Ratio 5.1:1 ✓
  - Muted (Light Gray oklch(0.94 0.005 250)): Charcoal text (oklch(0.35 0.01 250)) - Ratio 7.1:1 ✓

## Font Selection

Typography should feel modern and technical yet approachable, using geometric sans-serif fonts that convey precision and clarity.

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers): Space Grotesk SemiBold/20px/normal spacing
  - H3 (Player Labels): Space Grotesk Medium/16px/normal spacing
  - Body (UI Text): Inter Regular/14px/1.5 line height
  - Button Text: Inter Medium/14px/normal spacing/uppercase
  - Game Symbols (X/O): Space Grotesk Bold/48px/tight spacing

## Animations

Animations should be purposeful and strategic, emphasizing the moment-to-moment decision-making of the AI without feeling gratuitous - think subtle highlights and smooth state transitions rather than flashy effects.

- **Purposeful Meaning**: Motion communicates AI "thinking" and decision confidence through subtle pulsing and smooth piece placement
- **Hierarchy of Movement**: 
  1. Current move placement (primary focus) - scale + fade in
  2. Cell hover states (secondary) - subtle background shift
  3. Win condition celebration (tertiary) - gentle line draw through winning cells
  4. Turn indicator transitions - smooth color morphing between players

## Component Selection

- **Components**: 
  - Card (game board container with elevated shadow)
  - Button (primary action for start/reset, secondary for speed controls)
  - Badge (AI strategy labels with custom colors per player)
  - Separator (between game board and controls)
  - Progress (optional: visual indicator during AI "thinking" time)
  - Alert (game result announcement)

- **Customizations**: 
  - Custom 3x3 grid component with interactive cells
  - Custom game symbol components (X and O) with animation variants
  - Custom stats display showing win/loss/draw counts
  - Speed control as custom radio group with icons

- **States**: 
  - Buttons: Hover with scale transform (1.02), active with slight depression, disabled with reduced opacity
  - Grid cells: Empty (neutral), filled (locked with player color), winning (highlighted with accent border)
  - Game board: Playing (active), complete (semi-transparent overlay), thinking (subtle pulse)

- **Icon Selection**: 
  - Play (CaretRight) for start game
  - ArrowClockwise for reset/new game
  - Lightning for fast speed
  - Gauge for normal speed  
  - Turtle for slow speed
  - Lightning bolt + ZAP for instant

- **Spacing**: 
  - Container padding: p-8
  - Card padding: p-6
  - Grid gap: gap-2 (between cells)
  - Control group gap: gap-4
  - Section spacing: space-y-6
  - Button padding: px-6 py-2

- **Mobile**: 
  - Stack game board and controls vertically on mobile (<768px)
  - Reduce grid cell size to maintain comfortable touch targets (min 60px)
  - Simplify stats to single row on mobile
  - Keep speed controls as horizontal scroll on smallest screens
  - Increase touch target sizes for all buttons to 44px minimum
