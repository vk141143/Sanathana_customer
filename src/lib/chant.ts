import { createChantCatalogue } from './chantCatalog';
import { createChantTransport } from './chantTransport';
import { supabase } from './supabase';
import { auth } from './firebase';
import { API_BASE_URL } from './api';
export { CHANT_LANGUAGES } from './chantLanguages';
export interface ChantCategory { id:string; name:string; slug:string; description:string|null; cover_image_url:string|null; icon_url?:string|null; }
export type ChantType = 'mantra'|'nama_japa'|'stotram';
export interface Chant { mantra_type?:ChantType; id:string; title:string; short_description:string|null; category_id:string|null; original_text:string|null; transliteration:string|null; pronunciation_guide:string|null; source_title:string|null; source_reference:string|null; cover_image_url:string|null; featured:boolean; is_beginner_friendly:boolean; default_repetition_target:number; available_targets:number[]; }
export interface ChantTranslation { chant_id?:string; language_code:string; display_title:string|null; transliteration:string|null; pronunciation_guide:string|null; meaning:string|null; explanation:string|null; life_context:string|null; }
export interface ChantMedia { id:string; title:string; media_type:string; public_url:string; language_code:string|null; is_default:boolean; }
export interface ChantSession { id:string; chant_id:string; user_id:string; current_count:number; target_count:number; status:'active'|'paused'|'completed'|'abandoned'; version:number; duration_seconds:number; completed_malas:number; started_at:string; completed_at:string|null; reflection:string|null; language_code:string|null; }
export interface ChantMe { sessions:ChantSession[]; resumable:ChantSession[]; favourites:{chant_id:string}[]; stats:{practice_date:string; completed_sessions:number; total_repetitions:number; total_duration_seconds:number}[]; totals:{repetitions:number;sessions:number}; adminRole:string|null; }
export const chantApi = createChantTransport(API_BASE_URL, async () => {
 await auth.authStateReady();
 return auth.currentUser?.getIdToken();
});
export const { chantLibrary, chantDetails, getPublishedChant } = createChantCatalogue(supabase);
