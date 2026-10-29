import { supabase } from './supabase';
import { createPracticeChantCatalogue } from './practiceChantCatalog';

export const practiceChantCatalogue=createPracticeChantCatalogue(supabase);
