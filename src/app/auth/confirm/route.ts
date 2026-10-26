import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinationSure } from "@/lib/actions-compte";
import { createClient } from "@/lib/supabase/server";

// Arrivée depuis un lien d'e-mail (confirmation d'inscription ou mot de passe oublié) :
// on vérifie le jeton, on ouvre la session, puis on va vers la page demandée.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const destination = await destinationSure(searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    // Lien construit par nos modèles d'e-mail : marche même si l'e-mail est ouvert dans un autre navigateur.
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    // Lien par défaut de Supabase (même navigateur que la demande).
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  return NextResponse.redirect(new URL(ok ? destination : "/connexion?erreur=lien", origin));
}
