import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

/** Keep the existing integration, but never silently accept a database failure. */
export async function profileRequest(method: 'GET' | 'PUT', details?: { full_name: string; mobile: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again to complete your profile.');
  const fields = 'full_name,email,mobile,avatar_url,day_streak,books_read,events_count,chant_count';
  const result = method === 'GET'
    ? await supabase.from('users').select(fields).eq('firebase_uid', user.uid).maybeSingle()
    : await supabase.from('users').upsert({
        firebase_uid: user.uid, email: user.email, full_name: details?.full_name.trim(), mobile: details?.mobile.trim(),
      }, { onConflict: 'firebase_uid' }).select(fields).single();
  if (result.error) {
    const code = result.error.code;
    if (code === '23505') throw new Error('This email is linked to another profile. Please sign in with the original account or contact support.');
    if (code === '42501') throw new Error('Account profile access was denied. Please contact support to check profile permissions.');
    throw new Error(`Account profile could not be saved or loaded (${code || 'network error'}). Please retry.`);
  }
  if (auth.currentUser?.uid !== user.uid) throw new Error('Your account changed. Please sign in again.');
  return result.data;
}
