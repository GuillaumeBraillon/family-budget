import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET SUPABASE ⚠️
// Allez dans Settings > API dans votre dashboard Supabase
const SUPABASE_URL = 'https://apcnoskmvsojujxywjmx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY25vc2ttdnNvanVqeHl3am14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTk2NjYsImV4cCI6MjA4MTI5NTY2Nn0.BuKgJtxupxXcMpqWI5mLL6xvaodUnLPELAReW4JORqI'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);