import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || (Constants.manifest?.extra as any) || {}) as { SUPABASE_URL?: string, SUPABASE_ANON_KEY?: string };
const SUPABASE_URL = extra.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 