# Sanathana Festivals - Visual Guide

## 🏠 Home Page Layout

```
┌─────────────────────────────────────┐
│                                     │
│         SANATHANA HOME              │
│                                     │
│    [Profile] [Notifications]        │
│                                     │
│    Good Morning, Vishnu             │
│                                     │
│    ┌─────────────────────────────┐  │
│    │   Daily Verse Card          │  │
│    │   (from quote_schedules)    │  │
│    └─────────────────────────────┘  │
│                                     │
│    Continue Reading                 │
│    ┌─────────────────────────────┐  │
│    │  Bhagavad Gita Chapter 2    │  │
│    └─────────────────────────────┘  │
│                                     │
│    Today's Sadhana                  │
│                                     │
│    Row 1:                           │
│    🧘 Meditate  🎵 Chant  🙏 Gratitude
│                                     │
│    Row 2:                           │
│    📖 Read  🎶 Music  🪔 Festivals  │
│                                     │
│    Daily Streak                     │
│    🔥 5 Days Pure                   │
│                                     │
└─────────────────────────────────────┘
```

## 🪔 Festivals Icon

**Location**: Row 2 of Today's Sadhana (between Music and Read)

**Icon**: Lamp/Diya (🪔)

**SVG Path**:
```
M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z
```

**Styling**:
- Size: 8x8 (w-8 h-8)
- Color: Gold (#d4a85f)
- Container: 16x16 rounded circle
- Border: Gold with 30% opacity
- Background: Dark with 70% opacity
- Hover: Gold background with 20% opacity

---

## 📋 Festivals List Page Layout

```
┌─────────────────────────────────────┐
│                                     │
│         FESTIVALS                   │
│                                     │
│    [Search bar]                     │
│    🔍 Search festivals...           │
│                                     │
│    [Filter Tabs - Sticky]           │
│    All | Major | Ekadashi | ...     │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Festival Card 1            │  │
│    │  ┌───────────────────────┐  │  │
│    │  │   Festival Image      │  │  │
│    │  │   (from R2)           │  │  │
│    │  └───────────────────────┘  │  │
│    │                             │  │
│    │  🪔 Janmashtami             │  │
│    │  Krishna Janmashtami        │  │
│    │                             │  │
│    │  [Major Festival] 📅 Aug 15 │  │
│    │                             │  │
│    │  Celebrate the divine...    │  │
│    │                             │  │
│    │  🙏 Lord Krishna            │  │
│    │                             │  │
│    │                        Explore →│
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Festival Card 2            │  │
│    │  ...                        │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Festival Card 3            │  │
│    │  ...                        │  │
│    └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎴 Festival Card Anatomy

```
┌─────────────────────────────────────┐
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │   Festival Image            │   │
│   │   (Thumbnail from R2)       │   │
│   │   Height: 160px             │   │
│   │                             │   │
│   │   [Gradient Overlay]        │   │
│   └─────────────────────────────┘   │
│                                     │
│   Festival Info Section             │
│   ─────────────────────────────     │
│                                     │
│   🪔 Janmashtami              →     │
│   Krishna Janmashtami               │
│                                     │
│   [Major Festival] 📅 Aug 15, 2026  │
│                                     │
│   Celebrate the divine birth of     │
│   Lord Krishna with sacred rituals  │
│   and devotional practices...       │
│                                     │
│   ─────────────────────────────     │
│   🙏 Lord Krishna                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔍 Search & Filter Flow

```
User opens /festivals
    ↓
FestivalsListView loads
    ↓
Check cache
├─ Cache valid? → Display cached festivals
└─ Cache expired? → Fetch from Supabase
    ↓
Display festivals with search & filters
    ↓
User types in search
    ↓
Filter festivals client-side
    ↓
Display matching results
    ↓
User clicks filter tab
    ↓
Filter by festival type
    ↓
Display matching results
```

---

## 📊 Filter Categories

```
┌─────────────────────────────────────┐
│ All | Major Festival | Ekadashi |   │
│ Purnima | Amavasya | Jayanti |      │
│ Vrata | Utsava | Other              │
└─────────────────────────────────────┘

Active Filter Styling:
- Text: Gold (#f2c377)
- Border: Gold bottom border (2px)
- Font: Bold
- Background: Transparent

Inactive Filter Styling:
- Text: Muted gold (#d2c4b3/60)
- Border: None
- Font: Regular
- Background: Transparent
- Hover: Text becomes gold
```

---

## 🖼️ Image Loading Flow

```
Festival Card Renders
    ↓
Check festival.thumbnail?.public_url
    ├─ URL exists?
    │  ├─ Yes → Load image from R2
    │  │        ├─ Image loads → Display
    │  │        └─ Image fails → Show fallback
    │  └─ No → Show fallback gradient
    └─ Fallback: Gradient + Icon
       Color: Gold (#d4a85f) with 40% opacity
       Icon: Smiley face (placeholder)
```

---

## 💾 Cache Lifecycle

```
First Visit to /festivals
    ↓
Check localStorage for 'sanatana_cache_festivals_list'
    ├─ Not found → Fetch from Supabase
    └─ Found → Check TTL
        ├─ Valid (< 48 hours) → Use cache
        └─ Expired (> 48 hours) → Fetch from Supabase
    ↓
Store in cache with timestamp
    ↓
Display to user
    ↓
User refreshes page
    ↓
Check cache again
    ├─ Valid → Display immediately
    └─ Expired → Fetch fresh data
```

---

## 🔄 Navigation Flow

```
HOME PAGE
    ↓
Click "Festivals" icon
    ↓
onTabChange('festivals')
    ↓
App.tsx: currentTab = 'festivals'
    ↓
renderActiveTab() switch case
    ↓
<FestivalsListView />
    ↓
FESTIVALS LIST PAGE
    ├─ Search
    ├─ Filter
    └─ Click Festival Card
        ↓
        onSelectFestival(festivalId)
        ↓
        [Future] Navigate to /festivals/{festivalId}
        ↓
        [Future] FESTIVAL DETAIL PAGE
```

---

## 📱 Responsive Breakpoints

```
Mobile (< 430px)
┌─────────────────────────────────────┐
│ FESTIVALS                           │
│ [Search]                            │
│ [Filters - Horizontal Scroll]       │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
└─────────────────────────────────────┘

Tablet (430px - 768px)
┌─────────────────────────────────────┐
│ FESTIVALS                           │
│ [Search]                            │
│ [Filters - All Visible]             │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
└─────────────────────────────────────┘

Desktop (> 768px)
┌─────────────────────────────────────┐
│ FESTIVALS                           │
│ [Search]                            │
│ [Filters - All Visible]             │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
│ [Festival Card - Full Width]        │
└─────────────────────────────────────┘
(Max width: 430px, centered)
```

---

## 🎨 Color Palette

```
Primary Gold
├─ #d4a85f (Main gold)
├─ #f2c377 (Bright gold)
└─ #a6834d (Dark gold)

Background
├─ #0A0A0A (Main background)
├─ #1c1b1b (Card background)
└─ #2a2a2a (Skeleton background)

Text
├─ #e5e2e1 (Primary text)
├─ #d2c4b3 (Secondary text)
└─ #d2c4b3/60 (Muted text)

Borders
├─ #4e4539/20 (Light border)
├─ #d4a85f/30 (Gold border)
└─ #f2c377/40 (Bright gold border)
```

---

## ⚡ Loading States

```
Initial Load
┌─────────────────────────────────────┐
│ FESTIVALS                           │
│ [Search]                            │
│ [Filters]                           │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     │
│ └─────────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘

(Shimmer animation on skeleton cards)
```

---

## ❌ Error State

```
┌─────────────────────────────────────┐
│ FESTIVALS                           │
│ [Search]                            │
│ [Filters]                           │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ⚠️ Failed to load festivals. │     │
│ │ Please try again.           │     │
│ │                             │     │
│ │ [Try Again]                 │     │
│ └─────────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 Interaction States

### Button Hover
```
Normal:
- Border: Gold with 30% opacity
- Background: Dark with 70% opacity
- Text: Muted gold

Hover:
- Border: Gold with 40% opacity
- Background: Gold with 20% opacity
- Text: Bright gold
- Scale: 1.02x

Active (Click):
- Scale: 0.98x
```

### Card Hover
```
Normal:
- Border: Transparent
- Image: Normal scale
- Text: Normal color

Hover:
- Border: Gold with 40% opacity
- Image: Scale 1.05x (zoom)
- Text: Bright gold
- Arrow: Translate right 4px
```

---

## 📊 Data Structure

```
Festival Card Data:
{
  id: "uuid",
  name: "Janmashtami",
  alternate_name: "Krishna Janmashtami",
  festival_type: "Major Festival",
  short_description: "Celebrate the divine birth...",
  festival_date: "2026-08-15",
  status: "Published",
  thumbnail: {
    public_url: "https://r2.../thumbnail.webp"
  },
  primary_deity: {
    deity_name: "Lord Krishna",
    deity_image_url: "https://r2.../deity.webp"
  }
}
```

---

## 🎯 User Journey

```
1. User opens app
   ↓
2. Navigates to Home page
   ↓
3. Sees "Festivals" icon in Today's Sadhana
   ↓
4. Clicks "Festivals" icon
   ↓
5. Navigates to /festivals
   ↓
6. FestivalsListView loads
   ├─ Checks cache
   ├─ Fetches from Supabase if needed
   └─ Displays festivals
   ↓
7. User searches or filters
   ↓
8. Results update in real-time
   ↓
9. User clicks festival card
   ↓
10. [Future] Opens festival detail page
```

---

**Visual Guide Complete** ✅
**Version**: 1.0
**Date**: 2024
