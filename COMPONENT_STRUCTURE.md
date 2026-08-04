## Achievement Journey - Component Structure

```
AchievementsView
├── Background Image (/achieve.png)
├── Background Overlay (gradient)
├── Header
│   ├── Back Button
│   ├── Title: "SANATANA"
│   └── Navigation
├── Page Content
│   ├── Profile Row
│   │   ├── Avatar
│   │   └── Greeting + Name
│   ├── Hero Title Section
│   │   ├── Spiritual Title
│   │   └── Milestones Count
│   ├── Progress Bar
│   │   ├── Streak Progress
│   │   └── Percentage Complete
│   └── Section Title Divider
│       └── "Spiritual Journey"
└── SacredJourneyPath
    ├── Help Button
    │   └── Opens HelpSheet
    ├── Sacred Path Container
    │   ├── Vertical Path Line (glowing)
    │   └── Milestones Grid
    │       ├── MilestoneNode 1 (Lotus)
    │       ├── MilestoneNode 2 (Trishul)
    │       ├── MilestoneNode 3 (Om)
    │       ├── MilestoneNode 4 (Flame)
    │       ├── MilestoneNode 5 (Bell)
    │       ├── MilestoneNode 6 (Shankha)
    │       ├── MilestoneNode 7 (Gada)
    │       ├── MilestoneNode 8 (Chakra)
    │       ├── MilestoneNode 9 (Temple)
    │       └── MilestoneNode 10 (Divine Light)
    ├── Current Position Orb
    │   ├── Glowing Circle
    │   └── Aura Animation
    ├── MilestoneDetailSheet (Bottom Sheet)
    │   ├── Close Handle
    │   ├── Large Icon
    │   ├── Achievement Name
    │   ├── Description
    │   ├── Divider
    │   ├── Details Grid
    │   │   ├── Required Streak
    │   │   ├── Status
    │   │   └── Rewards (if unlocked)
    │   │       ├── XP Reward
    │   │       ├── Badge
    │   │       └── Temple Reward
    │   └── Close Button
    └── HelpSheet (Bottom Sheet)
        ├── Close Handle
        ├── Title: "Temple Journey Guide"
        ├── Achievements List
        │   ├── Achievement 1
        │   │   ├── Icon
        │   │   ├── Title
        │   │   ├── Description
        │   │   ├── Requirement
        │   │   └── Reward
        │   ├── Achievement 2
        │   └── ... (10 total)
        └── Close Button

Bottom CTA
└── "Discover More Rewards" Button
```

---

## MilestoneNode Component

```
MilestoneNode
├── Milestone Circle (w-16 h-16)
│   ├── State: Unlocked (gold gradient)
│   ├── State: Current (bright gold + pulse)
│   └── State: Locked (gray)
├── Icon (sacred symbol)
├── Milestone Info
│   ├── Title
│   └── Required Days
└── Status Badge
    ├── Current: "X Days Left"
    ├── Unlocked: "✓ Unlocked"
    └── Locked: (hidden)
```

---

## MilestoneDetailSheet Component

```
MilestoneDetailSheet (Bottom Sheet)
├── Backdrop (semi-transparent)
├── Glass Panel
│   ├── Close Handle
│   ├── Large Icon (w-20 h-20)
│   ├── Achievement Name (Cinzel)
│   ├── Description (Body MD)
│   ├── Divider
│   ├── Details Grid
│   │   ├── Required Streak
│   │   ├── Status
│   │   └── Rewards (conditional)
│   │       ├── XP Reward
│   │       ├── Badge
│   │       └── Temple Reward
│   └── Close Button
```

---

## HelpSheet Component

```
HelpSheet (Bottom Sheet)
├── Backdrop (semi-transparent)
├── Glass Panel (scrollable)
│   ├── Close Handle
│   ├── Title: "Temple Journey Guide"
│   ├── Achievements List (space-y-4)
│   │   ├── Achievement Item 1
│   │   │   ├── Icon
│   │   │   ├── Title
│   │   │   ├── Description
│   │   │   ├── Requirement
│   │   │   └── Reward
│   │   ├── Achievement Item 2
│   │   └── ... (10 total)
│   └── Close Button
```

---

## Styling Classes Used

### Milestone States
- `.milestone-node-unlocked`: Gold gradient, bright border, glow
- `.milestone-node-current`: Bright gold, animated pulse
- `.milestone-node-locked`: Gray gradient, dim border

### Path Elements
- `.sacred-path-line`: Glowing vertical line
- `.glass-panel`: Frosted glass effect
- `.glass-card`: Card with glass effect

### Animations
- `.animate-orb-pulse`: Pulsing glow on current position
- `.animate-current-aura`: Expanding aura around orb
- `.animate-slide-up`: Bottom sheet entrance

### Typography
- `.font-cinzel`: Headings (Cinzel serif)
- `.font-garamond`: Body text (EB Garamond)
- `.font-label-sm`: Labels (Inter, uppercase)
- `.font-body-md`: Body text (Inter)

---

## Color Palette

### Gold/Primary
- `#D4AF37` - Primary gold
- `#f2c377` - Light gold
- `#B8860B` - Dark gold
- `#b98d28` - Medium gold

### Backgrounds
- `#0B1220` - Dark background
- `#151B2D` - Medium dark
- `#1D2335` - Lighter dark
- `#1D2335/40` - Semi-transparent

### Text
- `#e5e2e1` - Primary text
- `#d2c4b3` - Secondary text
- `#d2c4b3/60` - Tertiary text
- `#d2c4b3/70` - Muted text

### Status
- `#4ade80` - Success/Unlocked (green)
- `#7a6d5f` - Locked/Disabled (gray)

---

## Responsive Breakpoints

- **Small Android**: 320px - 480px
- **Medium Android**: 480px - 720px
- **Large Android**: 720px - 1080px
- **Foldables**: 1080px - 1440px
- **Tablets**: 1440px+

All use `max-w-lg` (32rem) container for consistency.

---

## Interaction Flow

### User Taps Milestone
1. `MilestoneNode` onClick triggered
2. `handleMilestoneClick()` called
3. `selectedAchievement` state updated
4. `showDetailSheet` set to true
5. `MilestoneDetailSheet` animates in with `animate-slide-up`

### User Closes Detail Sheet
1. Click close button OR click backdrop
2. `showDetailSheet` set to false
3. Sheet animates out (translate-y-full)

### User Opens Help
1. Click help button
2. `showHelpSheet` set to true
3. `HelpSheet` animates in with `animate-slide-up`
4. User can scroll through all achievements
5. Click close button to dismiss

---

## Data Flow

```
AchievementsView
  ├── user.dayStreak → SacredJourneyPath
  │   └── currentStreak prop
  │
  └── SacredJourneyPath
      ├── STREAK_ACHIEVEMENTS (from data)
      ├── Calculate states:
      │   ├── isUnlocked = currentStreak >= requiredStreak
      │   ├── isCurrent = !isUnlocked && previous unlocked
      │   └── daysRemaining = requiredStreak - currentStreak
      │
      ├── MilestoneNode
      │   └── Displays based on state
      │
      ├── MilestoneDetailSheet
      │   └── Shows full details on tap
      │
      └── HelpSheet
          └── Lists all achievements
```

---

## Performance Considerations

- ✓ Minimal re-renders (state only in SacredJourneyPath)
- ✓ CSS animations (no JavaScript animations)
- ✓ Fixed background (GPU accelerated)
- ✓ Lazy rendering of sheets (only when open)
- ✓ No heavy computations
- ✓ Efficient grid layout

---

## Accessibility

- ✓ Semantic HTML structure
- ✓ Clear button labels
- ✓ High contrast colors
- ✓ Touch-friendly sizes (w-16 h-16 = 64px)
- ✓ Readable typography
- ✓ Clear status indicators
