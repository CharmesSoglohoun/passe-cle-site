import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Règle du workspace Jarvis : les clés vivent uniquement dans le .env à la racine du workspace.
// En local, on le charge depuis là. En ligne, Vercel fournit les variables lui-même (ce dossier n'existe pas).
const workspaceRoot = path.resolve(process.cwd(), "../../../..");
if (existsSync(path.join(workspaceRoot, ".env"))) {
  // forceReload : Next.js a déjà chargé (et mis en cache) les .env du dossier site, qui n'en a pas.
  loadEnvConfig(workspaceRoot, process.env.NODE_ENV !== "production", undefined, true);

  // Le .env du workspace sert aussi à Charmes : les clés de Passe-Clé y portent le préfixe PASSECLE_.
  // On les recopie sous le nom attendu par le code, à la place de celles de Charmes.
  if (process.env.PASSECLE_SUPABASE_URL && process.env.PASSECLE_SUPABASE_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.PASSECLE_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.PASSECLE_SUPABASE_PUBLISHABLE_KEY;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Photos envoyées par les membres, servies par le stockage Supabase
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
