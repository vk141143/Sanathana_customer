# Festivals Feature - Quick Reference Guide

## File Structure

```
src/
├── components/
│   ├── FestivalsListView.tsx          ← Main festivals list page
│   ├── HomeView.tsx                   ← Updated with Festivals icon
│   └── ...
├── lib/
│   ├── cache.ts                       ← Cache utility (NEW)
│   ├── supabase.ts                    ← Existing Supabase client
│   └── ...
├── types.ts                           ← Updated with Festival types
├── App.tsx                            ← Updated with festivals route
└── ...
```

## Key Components

### FestivalsListView
**Location**: `src/components/FestivalsListView.tsx`

**Props**:
```typescript
interface FestivalsListViewProps {
  onTabChange: (tab: NavTab) => void;
  onSelectFestival: (festivalId: string) => void;
}
```

**Features**:
- Fetches published festivals from Supabase
- Search by name/alternate name
- Filter by festival type
- Displays festival cards with images from R2
- Lazy loads images
- Caches data for 48 hours

**Usage**:
```typescript
<FestivalsListView
  onTabChange={setCurrentTab}
  onSelectFestival={(festivalId) => {
    // Handle festival selection
  }}
/>
```

## Supabase Queries

### Fetch Published Festivals
```typescript
const { data, error } = await supabase
  .from('festivals')
  .select('id, name, alternate_name, festival_type, short_description, festival_date, start_date, end_date, status')
  .eq('status', 'Published')
  .order('festival_date', { ascending: true });
```

### Fetch Festival Media (Thumbnail)
```typescript
const { data, error } = await supabase
  .from('festival_media')
  .select('id, festival_id, media_type, storage_key, public_url, file_name, display_order')
  .eq('festival_id', festivalId)
  .in('media_type', ['thumbnail', 'banner'])
  .order('display_order', { ascending: true })
  .limit(1)
  .maybeSingle();
```

### Fetch Primary Deity
```typescript
const { data, error } = await supabase
  .from('festival_deities')
  .select('id, festival_id, deity_name, deity_image_url, deity_description, is_primary, sort_order')
  .eq('festival_id', festivalId)
  .eq('is_primary', true)
  .limit(1)
  .maybeSingle();
```

## Cache Utility

**Location**: `src/lib/cache.ts`

### Usage

**Set Cache**:
```typescript
import { cache } from '../lib/cache';

cache.set('festivals_list', festivalData);
// or with custom TTL (in milliseconds)
cache.set('festivals_list', festivalData, 72 * 60 * 60 * 1000); // 72 hours
```

**Get Cache**:
```typescript
const cached = cache.get<FestivalWithMedia[]>('festivals_list');
if (cached) {
  // Use cached data
}
```

**Remove Cache**:
```typescript
cache.remove('festivals_list');
```

**Clear All Cache**:
```typescript
cache.clear();
```

## Types

**Location**: `src/types.ts`

```typescript
export interface Festival {
  id: string;
  name: string;
  alternate_name?: string;
  festival_type: 'Major Festival' | 'Ekadashi' | 'Purnima' | 'Amavasya' | 'Jayanti' | 'Vrata' | 'Utsava' | 'Other';
  short_description?: string;
  festival_date?: string;
  start_date?: string;
  end_date?: string;
  status: 'Draft' | 'Published' | 'Archived';
}

export interface FestivalMedia {
  id: string;
  festival_id: string;
  media_type: 'banner' | 'thumbnail' | 'illustration' | 'deity' | 'story' | 'puja' | 'gallery' | 'audio' | 'video' | 'notification';
  storage_key: string;
  public_url: string;
  file_name?: string;
  display_order: number;
}

export interface FestivalDeity {
  id: string;
  festival_id: string;
  deity_name: string;
  deity_image_url?: string;
  deity_description?: string;
  is_primary: boolean;
  sort_order: number;
}
```

## Navigation

### From Home to Festivals
```
HomeView
  ↓
Click "Festivals" icon
  ↓
onTabChange('festivals')
  ↓
App.tsx: currentTab = 'festivals'
  ↓
renderActiveTab() → FestivalsListView
```

### From Festivals to Detail (Future)
```
FestivalsListView
  ↓
Click festival card
  ↓
onSelectFestival(festivalId)
  ↓
Navigate to /festivals/{festivalId}
  ↓
FestivalDetailView (to be implemented)
```

## Styling

### Colors
```
Primary Gold:     #d4a85f, #f2c377
Background:       #0A0A0A, #1c1b1b
Text:             #e5e2e1, #d2c4b3
Accent:           #f2c377
```

### Typography
```
Headings:         font-cinzel
Body:             font-body-md
Labels:           font-label-sm
```

### Components
```
Cards:            glass-card
Buttons:          Rounded with hover effects
Icons:            SVG with drop-shadow
```

## Performance Tips

### 1. Caching
- Cache is automatically set after first fetch
- Cache expires after 48 hours
- Manual refresh forces new fetch

### 2. Image Loading
- Use `loading="lazy"` for images
- Images load from Cloudflare R2 CDN
- Fallback gradient if image unavailable

### 3. Queries
- Only fetch fields needed for list view
- Use `.maybeSingle()` for single results
- Parallel queries for media and deities

### 4. Filtering
- Search and filters applied client-side
- No additional Supabase queries needed
- Smooth real-time filtering

## Common Tasks

### Add a New Festival Type Filter
1. Update `FESTIVAL_TYPES` array in `FestivalsListView.tsx`
2. Update `FestivalType` type in same file
3. Update database `festival_type` enum if needed

### Change Cache TTL
```typescript
// In FestivalsListView.tsx
cache.set(cacheKey, enrichedFestivals, 72 * 60 * 60 * 1000); // 72 hours
```

### Add Pagination
```typescript
// In FestivalsListView.tsx
const { data, error } = await supabase
  .from('festivals')
  .select('...')
  .eq('status', 'Published')
  .order('festival_date', { ascending: true })
  .range(0, 19); // First 20 results
```

### Modify Festival Card Display
Edit the festival card JSX in `FestivalsListView.tsx` around line 150-200.

### Add New Festival Field
1. Add field to `Festival` interface in `types.ts`
2. Add field to Supabase query in `FestivalsListView.tsx`
3. Display field in festival card JSX

## Debugging

### Check Cache
```javascript
// In browser console
localStorage.getItem('sanatana_cache_festivals_list')
```

### Clear Cache
```javascript
// In browser console
localStorage.removeItem('sanatana_cache_festivals_list')
// or clear all
localStorage.clear()
```

### Check Supabase Query
```typescript
// Add console.log in FestivalsListView.tsx
console.log('Festival data:', festivalData);
console.log('Media data:', mediaData);
console.log('Deity data:', deityData);
```

### Check R2 Images
- Verify `public_url` is correct
- Check Cloudflare R2 bucket for files
- Verify file permissions are public

## Troubleshooting

### Festivals Not Showing
1. Check if festivals have `status = 'Published'`
2. Check browser console for errors
3. Clear cache and refresh
4. Verify Supabase connection

### Images Not Loading
1. Check `public_url` in festival_media table
2. Verify Cloudflare R2 bucket is public
3. Check browser network tab for 404s
4. Verify file exists in R2

### Search Not Working
1. Check search query is being set
2. Verify festival names in database
3. Check console for JavaScript errors

### Cache Not Working
1. Check localStorage is enabled
2. Verify cache key is correct
3. Check TTL hasn't expired
4. Clear cache and try again

## Related Files

- `src/App.tsx` - Main app component with routing
- `src/components/Header.tsx` - Header component used in FestivalsListView
- `src/components/HomeView.tsx` - Home page with Festivals icon
- `src/lib/supabase.ts` - Supabase client configuration
- `src/types.ts` - TypeScript type definitions

## Next Steps

1. **Festival Detail Page** (Phase 2)
   - Create `FestivalDetailView.tsx`
   - Implement content sections
   - Lazy load story/puja JSON from R2
   - Add progress bar and navigation

2. **Advanced Features** (Phase 3)
   - Pagination
   - Notifications
   - User progress tracking
   - Bookmarking

3. **Admin Integration** (Phase 4)
   - Cache invalidation
   - Publishing workflow
   - Analytics

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
