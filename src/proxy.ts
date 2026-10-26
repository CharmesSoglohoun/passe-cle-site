import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Pages réservées aux personnes connectées. Le rôle admin est vérifié en plus dans /admin.
const PAGES_PRIVEES = ["/mon-espace", "/publier", "/admin", "/nouveau-mot-de-passe"];

// Le proxy passe avant chaque page : il rafraîchit la session Supabase si elle a expiré,
// pour que le navigateur et le serveur restent d'accord sur « qui est connecté ».
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sans les clés Supabase (projet mal configuré), on laisse passer plutôt que de casser tout le site.
  let env: ReturnType<typeof supabaseEnv>;
  try {
    env = supabaseEnv();
  } catch {
    console.error("Proxy : variables Supabase absentes, session non vérifiée.");
    return response;
  }
  const { url, key } = env;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Une réponse qui pose des cookies de session ne doit jamais être mise en cache.
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims vérifie la signature du jeton : c'est ce qui déclenche le rafraîchissement.
  const { data } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  const pagePrivee = PAGES_PRIVEES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (pagePrivee && !data?.claims) {
    const cible = new URL("/connexion", request.url);
    cible.searchParams.set("suite", pathname + search);
    const versConnexion = NextResponse.redirect(cible);
    response.cookies.getAll().forEach((c) => versConnexion.cookies.set(c));
    return versConnexion;
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques, les images et les icônes
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|photos/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
