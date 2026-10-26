// Les deux variables publiques de Supabase. Elles viennent du .env du workspace (en local,
// sous le nom PASSECLE_..., voir next.config.ts) ou des réglages Vercel (en ligne).
// La clé « publishable » peut être vue par le navigateur : ce sont les règles RLS de la base
// qui protègent les données.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, key };
}
