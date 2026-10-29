import { useEffect, useState } from 'react';
import type { ChantPractice } from '../../lib/practiceChantCatalog';

export function usePracticeChants(load:()=>Promise<ChantPractice[]>,revision=0) {
  const [practices,setPractices]=useState<ChantPractice[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  useEffect(()=>{
    let alive=true;setLoading(true);setError('');
    void load().then(rows=>{if(alive)setPractices(rows);})
      .catch(cause=>{if(alive)setError(cause instanceof Error?cause.message:'Unable to load Chant practices. Please retry.');})
      .finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};
  },[load,revision]);
  return {practices,loading,error};
}
