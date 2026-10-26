import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Membre = {
  id: string;
  email: string;
  prenom: string;
  etablissement: string;
  role: "membre" | "admin";
  etudiant_verifie: boolean;
  suspendu: boolean;
};

// La personne connectée et son profil, ou null pour un visiteur.
export async function membreConnecte(): Promise<Membre | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profil } = await supabase
    .from("profils")
    .select("prenom, etablissement, role, etudiant_verifie, suspendu")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: String(claims.email ?? ""),
    prenom: profil?.prenom ?? "",
    etablissement: profil?.etablissement ?? "",
    role: profil?.role === "admin" ? "admin" : "membre",
    etudiant_verifie: profil?.etudiant_verifie ?? false,
    suspendu: profil?.suspendu ?? false,
  };
}

// Pour les pages et actions réservées : renvoie vers la connexion si besoin.
export async function exigerMembre(suite = "/mon-espace") {
  const membre = await membreConnecte();
  if (!membre) redirect(`/connexion?suite=${encodeURIComponent(suite)}`);
  return membre;
}

// L'interface admin vérifie le rôle ici ; la base le revérifie dans chaque règle RLS.
export async function exigerAdmin() {
  const membre = await exigerMembre("/admin");
  if (membre.role !== "admin" || membre.suspendu) redirect("/");
  return membre;
}
