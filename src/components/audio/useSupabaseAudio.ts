import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface SupabaseTrack {
  id: string;
  title: string;
  artist: string;
  album_id: string;
  language: string;
  duration: string;
  is_premium: boolean;
  audio_url: string;
  status: 'Active' | 'Draft';
}

export interface SupabaseAlbum {
  id: string;
  title: string;
  artist: string;
  description: string;
  cover_url: string;
  status: 'Draft' | 'Premium' | 'Public';
  track_count: number;
  tracks?: SupabaseTrack[];
}

export function useSupabaseAudio() {
  const [albums, setAlbums] = useState<SupabaseAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = async () => {
    const { data: albumData, error: albumErr } = await supabase
      .from('albums')
      .select('*')
      .in('status', ['Public', 'Premium'])
      .order('created_at', { ascending: false });

    if (albumErr) { setError(albumErr.message); setLoading(false); return; }

    const { data: trackData, error: trackErr } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: true });

    if (trackErr) { setError(trackErr.message); setLoading(false); return; }

    const albumsWithTracks = (albumData as SupabaseAlbum[]).map(album => ({
      ...album,
      tracks: (trackData as SupabaseTrack[]).filter(t => t.album_id === album.id),
    }));

    setAlbums(albumsWithTracks);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlbums();

    const albumSub = supabase
      .channel('albums-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, fetchAlbums)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_tracks' }, fetchAlbums)
      .subscribe();

    return () => { supabase.removeChannel(albumSub); };
  }, []);

  return { albums, loading, error };
}
