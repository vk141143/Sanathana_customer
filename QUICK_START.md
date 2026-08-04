## Achievement Journey Redesign - Quick Start Guide

### What's New?

The Achievement Journey page has been completely redesigned to feel like a sacred pilgrimage through a divine temple. Instead of large achievement cards, users now see:

- **Vertical Sacred Path**: A glowing golden line representing the spiritual journey
- **10 Unique Milestones**: Each with a different sacred symbol (Lotus, Trishul, Om, etc.)
- **Expandable Details**: Tap any milestone to see full details in a bottom sheet
- **Help Guide**: Access the "Temple Journey Guide" to learn about all achievements
- **Current Position Orb**: A glowing orb shows exactly where you are on the journey

---

## Files Changed

### New Files
- `src/components/SacredJourneyPath.tsx` - Main component for the sacred journey path

### Modified Files
- `src/components/AchievementsView.tsx` - Refactored to use SacredJourneyPath
- `src/App.tsx` - Removed unused `achievements` prop

### Unchanged Files
- `src/index.css` - All animations already present
- `src/data/achievements.ts` - No changes needed
- All other components - No changes

---

## How to Test

### 1. Run the App
```bash
npm run dev
```

### 2. Navigate to Achievements
- Log in with any credentials
- Click the "Achievements" tab in bottom navigation
- Or navigate from Profile → Achievements

### 3. Test Features

#### View the Sacred Path
- Scroll through the vertical journey
- See all 10 milestones with their sacred symbols
- Notice the glowing golden path line

#### Tap a Milestone
- Click any milestone node
- A bottom sheet slides up with details
- See the achievement name, description, requirements
- If unlocked, see the rewards (XP, Badge, Temple Reward)
- If locked, see how many days remain

#### Open Help Guide
- Click the "Guide" button at the top right
- See the "Temple Journey Guide" with all 10 achievements
- Scroll through to see requirements and rewards
- Click "Close Guide" to dismiss

#### Check Current Position
- If you have an active streak, see the glowing orb
- It shows your exact position on the journey
- The orb pulses with a subtle aura

#### Close Sheets
- Click the close button, or
- Click the backdrop (semi-transparent area)

---

## Customization

### Change Background Image
Edit `AchievementsView.tsx`:
```tsx
style={{
  backgroundImage: 'url(/your-image.png)',  // Change this
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
}}
```

### Adjust Colors
Edit `SacredJourneyPath.tsx` and `index.css`:
- Gold: `#D4AF37` (primary), `#f2c377` (light), `#B8860B` (dark)
- Text: `#e5e2e1` (primary), `#d2c4b3` (secondary)
- Success: `#4ade80` (green)

### Modify Milestone Spacing
Edit `SacredJourneyPath.tsx`:
```tsx
<div className="grid grid-cols-1 gap-12 px-4">  {/* gap-12 = 48px */}
```
Change `gap-12` to adjust vertical spacing between milestones.

### Adjust Milestone Size
Edit `MilestoneNode` in `SacredJourneyPath.tsx`:
```tsx
<div className="w-16 h-16 rounded-full ...">  {/* w-16 h-16 = 64px */}
```
Change to `w-20 h-20` for larger, `w-14 h-14` for smaller.

---

## Animation Details

All animations are CSS-based (in `index.css`):

### Current Position Orb
- `animate-orb-pulse`: Pulsing glow effect (2.5s)
- `animate-current-aura`: Expanding aura (2.5s)

### Bottom Sheets
- `animate-slide-up`: Slides up from bottom (0.35s)

### Path Line
- `.sacred-path-line`: Glowing gradient line

### Milestone States
- `.milestone-node-unlocked`: Gold gradient with glow
- `.milestone-node-current`: Bright gold with pulse
- `.milestone-node-locked`: Gray with no glow

---

## Data Structure

### Achievements (from `data/achievements.ts`)
```typescript
{
  id: string;           // Unique identifier
  title: string;        // Achievement name
  description: string;  // Short description
  requiredStreak: number; // Days needed to unlock
  iconKey: string;      // Sacred symbol key
}
```

### User Profile (from `types.ts`)
```typescript
{
  dayStreak: number;    // Current streak (used to determine unlocked achievements)
  // ... other fields
}
```

---

## Component Props

### AchievementsView
```typescript
interface AchievementsViewProps {
  user: UserProfile;
  onTabChange: (tab: NavTab) => void;
}
```

### SacredJourneyPath
```typescript
interface SacredJourneyPathProps {
  currentStreak: number;  // User's current streak
}
```

---

## State Management

All state is managed within `SacredJourneyPath`:
- `selectedAchievement`: Currently selected milestone
- `showDetailSheet`: Detail sheet visibility
- `showHelpSheet`: Help sheet visibility

No external state management needed.

---

## Responsive Design

The layout automatically adapts to:
- Small phones (320px)
- Medium phones (480px)
- Large phones (720px)
- Tablets (1080px+)

Uses `max-w-lg` container for consistency across all sizes.

---

## Performance

- ✓ Minimal re-renders
- ✓ CSS animations (GPU accelerated)
- ✓ Lazy sheet rendering
- ✓ No heavy computations
- ✓ Efficient grid layout

---

## Accessibility

- ✓ Touch-friendly sizes (64px minimum)
- ✓ High contrast colors
- ✓ Clear status indicators
- ✓ Semantic HTML
- ✓ Readable typography

---

## Future Enhancements

Ready to add:
- [ ] Unlock animations when streak reaches milestone
- [ ] Confetti/celebration effects
- [ ] Sound effects for unlocks
- [ ] Backend integration for unlock dates
- [ ] Custom rewards per achievement
- [ ] Achievement sharing
- [ ] Leaderboards
- [ ] Streak notifications

---

## Troubleshooting

### Milestones not showing
- Check `STREAK_ACHIEVEMENTS` in `data/achievements.ts`
- Verify `currentStreak` prop is passed correctly

### Background image not showing
- Ensure `/achieve.png` exists in `public/` folder
- Check file path in `AchievementsView.tsx`

### Animations not working
- Verify `index.css` has all animations
- Check browser supports CSS animations
- Try clearing browser cache

### Bottom sheets not opening
- Check `showDetailSheet` and `showHelpSheet` state
- Verify click handlers are attached
- Check z-index values (should be 40, 50)

### Styling issues
- Verify Tailwind CSS is configured
- Check color values in `index.css`
- Ensure fonts are loaded (Cinzel, Garamond, Inter)

---

## Browser Support

- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile browsers
- ✓ Requires CSS Grid, Flexbox, Backdrop Filter

---

## Notes

- No backend changes required
- No streak logic implemented (as requested)
- All data is static from `achievements.ts`
- Ready for future unlock logic
- Maintains app's design language
- Fully responsive
- Accessible and performant

---

## Support

For issues or questions:
1. Check the `ACHIEVEMENT_REDESIGN.md` file for detailed documentation
2. Review `COMPONENT_STRUCTURE.md` for component hierarchy
3. Check `index.css` for animation definitions
4. Verify all imports are correct in component files
