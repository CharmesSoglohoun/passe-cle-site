"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type EtatProfil = { statut: "repos" | "ok" | "erreur"; message?: string };

export async function majProfil(_e: EtatProfil, f: FormData): Promise<EtatProfil> {
  const prenom = String(f.get("prenom") ?? "").trim().slice(0, 60);
  const etablissement = String(f.get("etablissement") ?? "").trim().slice(0, 120);
  if (prenom.length < 2) return { statut: "erreur", message: "Indiquez votre prénom." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { statut: "erreur", message: "Session expirée, reconnectez-vous." };
  const { error } = await supabase.from("profils").update({ prenom, etablissement }).eq("id", data.claims.sub);
  if (error) return { statut: "erreur", message: "L'enregistrement n'a pas fonctionné." };
  revalidatePath("/", "layout");
  return { statut: "ok" };
}

// L'auteur peut retirer son annonce, la marquer attribuée, ou la remettre en ligne
// (la base refuse tout autre changement de statut).
export async function changerStatut(annonceId: number, statut: "retiree" | "attribuee" | "publiee") {
  const supabase = await createClient();
  const { error } = await supabase.from("annonces").update({ statut }).eq("id", annonceId);
  revalidatePath("/mon-espace");
  return { ok: !error };
}

// Supprime tous les fichiers d'un dossier du stockage (et de ses sous-dossiers).
async function viderDossier(supabase: SupabaseClient, dossier: string) {
  const { data } = await supabase.storage.from("photos-annonces").list(dossier, { limit: 1000 });
  if (!data?.length) return;
  const fichiers = data.filter((e) => e.id).map((e) => `${dossier}/${e.name}`);
  const sousDossiers = data.filter((e) => !e.id).map((e) => `${dossier}/${e.name}`);
  if (fichiers.length) await supabase.storage.from("photos-annonces").remove(fichiers);
  for (const s of sousDossiers) await viderDossier(supabase, s);
}

export async function supprimerAnnonce(annonceId: number) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false };
  await viderDossier(supabase, `${data.claims.sub}/${annonceId}`);
  const { error } = await supabase.from("annonces").delete().eq("id", annonceId);
  revalidatePath("/mon-espace");
  return { ok: !error };
}

export async function supprimerMonCompte(f: FormData) {
  if (String(f.get("confirmation") ?? "").trim().toUpperCase() !== "SUPPRIMER") {
    redirect("/mon-espace?suppression=refusee");
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/connexion");

  // Les photos d'abord (le stockage ne se vide pas depuis la base), puis le compte et tout ce qui en dépend.
  await viderDossier(supabase, data.claims.sub);
  const { error } = await supabase.rpc("supprimer_mon_compte");
  if (error) redirect("/mon-espace?suppression=erreur");
  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
