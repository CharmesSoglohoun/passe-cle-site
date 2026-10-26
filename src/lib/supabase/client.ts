import { createBrowserClient } from "@supabase/ssr";

// Client Supabase côté navigateur (envoi des photos). Les règles RLS limitent ce qu'il peut faire.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
