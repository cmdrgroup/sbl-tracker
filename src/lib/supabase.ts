import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bsvreslnbuqkjgnufpis.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdnJlc2xuYnVxa2pnbnVmcGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTk1NjksImV4cCI6MjA5MjQzNTU2OX0.X_jJ01jpQ2eHgSlD9M_EMF8ccyjXgutWcwv5Yx86GME";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
