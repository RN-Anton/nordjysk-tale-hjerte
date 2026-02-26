

# Make the UI "Sexy" -- Premium Visual Polish

## What changes

### 1. `src/index.css` -- Add gradient background, smooth transitions, and glow effects
- Replace flat background with a subtle gradient (light: soft blue-white gradient; dark: deep navy gradient)
- Add smooth transition on all interactive elements for a buttery feel
- Add a subtle card glow/shadow effect via custom utility classes
- Add a pulsing gradient animation for the generate button

### 2. `src/pages/Index.tsx` -- Elevated layout and micro-interactions
- **Header**: Add a subtle backdrop blur and gradient overlay so it feels layered and premium. Remove the hard `border-b` and replace with a soft shadow
- **Card**: Add a subtle border glow effect, slightly translucent background (`bg-card/80 backdrop-blur`), and a hover lift transition
- **Textarea**: Add a focus glow ring effect (subtle blue glow on focus) and smooth transition
- **Primary CTA button ("Generer lydfil")**: Add a gradient background (primary to a slightly lighter shade) with a subtle hover glow/shadow effect. Add a scale-up micro-animation on hover
- **Upload button**: Add a subtle hover lift effect
- **Audio output section**: Add a gradient border or subtle inner glow to make it feel special
- **Progress bar**: Add a gradient fill and a shimmer/pulse animation while generating
- **Overall spacing**: Keep current generous spacing, just refine with more consistent rhythm

### 3. `src/components/ui/progress.tsx` -- Animated gradient progress bar
- Change the indicator from solid `bg-primary` to a gradient
- Add a shimmer animation overlay for a premium loading feel

### 4. `src/components/ui/card.tsx` -- Premium card styling
- Add `transition-all duration-300` for smooth hover effects
- Support backdrop-blur by default

### 5. `src/components/ui/button.tsx` -- Smooth transitions
- Add `transition-all duration-200` to all buttons for smoother hover states

## Technical details

### New CSS additions in `index.css`
- Keyframe animation `shimmer` for progress bar shine effect
- Keyframe animation `glow-pulse` for subtle button glow
- Utility class `.glass` for glassmorphism card effect
- Smooth `transition-colors duration-200` on body-level interactive elements

### Index.tsx specific changes
- Header: `bg-gradient-to-r from-primary to-primary/90 shadow-lg` instead of flat `bg-primary border-b`
- Card: add `backdrop-blur-sm bg-card/95 shadow-xl hover:shadow-2xl transition-all duration-300`
- Generate button: `bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-200`
- Textarea: `focus:shadow-lg focus:shadow-primary/10 transition-all duration-200`
- Audio section: `bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm`

### Files changed
- `src/index.css`
- `src/pages/Index.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`

### What stays the same
- All functionality, API calls, state logic
- Color palette (Region Nordjylland blue identity)
- Dark mode support
- Component structure and layout hierarchy

