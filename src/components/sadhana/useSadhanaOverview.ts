import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { chantApi, type ChantMe } from '../../lib/chant';
import { meditationApi, type MeditationHistory } from '../../services/meditationApi';
import type { SadhanaProgress } from '../../services/sadhana/progressTypes';

export type ProgressSnapshot = Partial<SadhanaProgress>;
export function useSadhanaOverview() {
  const [uid, setUid] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [meditation, setMeditation] = useState<MeditationHistory | null>(null);
  const [chant, setChant] = useState<ChantMe | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => onAuthStateChanged(auth, user => {
    setProgress(null); setMeditation(null); setChant(null); setErrors([]);
    setUid(user?.uid ?? null);
  }), []);
  useEffect(() => {
    let alive = true;
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    Promise.allSettled([meditationApi.getHistory(), chantApi<ChantMe>('/me')]).then(([med, japa]) => {
      if (!alive || auth.currentUser?.uid !== uid) return;
      const issues: string[] = [];
      if (med.status === 'fulfilled') {
        setMeditation(med.value);
        setProgress(med.value.progress as ProgressSnapshot | null);
      } else { setMeditation(null); setProgress(null); issues.push('Sadhana progress and meditation history could not be loaded.'); }
      if (japa.status === 'fulfilled') setChant(japa.value);
      else { setChant(null); issues.push('Saved Japa history could not be loaded.'); }
      setErrors(issues); setLoading(false);
    });
    return () => { alive = false; };
  }, [uid, revision]);
  useEffect(() => {
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('chant-progress', refresh);
    window.addEventListener('meditation-progress', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('chant-progress', refresh);
      window.removeEventListener('meditation-progress', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  return { uid, progress, meditation, chant, loading, errors, refresh };
}
