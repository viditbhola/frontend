import { createClient } from '@supabase/supabase-js'

// The anon key is public by design; it is only used for login/session.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
