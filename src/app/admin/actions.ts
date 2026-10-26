"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Chaque action revérifie le rôle ici, et la base le revérifie encore dans ses règles RLS.

export async function modererAnnonce(f: FormData) {
  await exigerAdmin();
  const id = Number(f.get("id"));
  const statut = String(f.get("statut") ?? "");
  const motif = String(f.get("motif") ?? "").trim().slice(0, 500);
  if (!Number.isInteger(id) || !["publiee", "refusee", "retiree", "en_attente"].includes(statut)) return;

  const supabase = await createClient();
  await supabase
    .from("annonces")
    .update({ statut, motif_moderation: statut === "publiee" ? null : motif || null })
    .eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/logements");
}

export async function supprimerAnnonceAdmin(f: FormData) {
  await exigerAdmin();
  const id = Number(f.get("id"));
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();

  // Photos du stockage d'abord (chemins enregistrés dans la table photos).
  const { data: photos } = await supabase.from("photos").select("chemin").eq("annonce_id", id);
  const chemins = (photos ?? []).map((p) => p.chemin).filter((c) => !c.startsWith("/"));
  if (chemins.length) await supabase.storage.from("photos-annonces").remove(chemins);

  await supabase.from("annonces").delete().eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/logements");
}

export async function traiterSignalement(f: FormData) {
  await exigerAdmin();
  const id = Number(f.get("id"));
  const statut = String(f.get("statut") ?? "");
  if (!Number.isInteger(id) || !["traite", "rejete", "ouvert"].includes(statut)) return;
  const supabase = await createClient();
  await supabase.from("signalements").update({ statut }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function majUtilisateur(f: FormData) {
  await exigerAdmin();
  const id = String(f.get("id") ?? "");
  const supabase = await createClient();
  await supabase.rpc("admin_maj_utilisateur", {
    p_id: id,
    p_verifie: f.get("etudiant_verifie") === "1",
    p_suspendu: f.get("suspendu") === "1",
  });
  revalidatePath("/admin", "layout");
}
