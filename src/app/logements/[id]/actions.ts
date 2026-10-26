"use server";

import { revalidatePath } from "next/cache";
import { MOTIFS_SIGNALEMENT } from "@/lib/annonces";
import { createClient } from "@/lib/supabase/server";

export type Contact = { nom: string; telephone: string; email: string; conditions: string };
export type EtatContact = { statut: "repos" | "ok" | "erreur"; contact?: Contact; message?: string };

const MESSAGES: Record<string, string> = {
  connexion_requise: "Connectez-vous pour voir les coordonnées du bailleur.",
  compte_suspendu: "Votre compte est suspendu. Contactez l'équipe Passe-Clé.",
  annonce_indisponible: "Cette annonce n'est plus disponible.",
  limite_atteinte: "Vous avez consulté beaucoup de contacts aujourd'hui. Réessayez demain.",
};

// Les coordonnées passent uniquement par la fonction de la base, qui vérifie et journalise.
export async function voirContact(annonceId: number): Promise<EtatContact> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("voir_contact_bailleur", { p_annonce: annonceId });
  if (error) {
    const code = Object.keys(MESSAGES).find((k) => error.message.includes(k));
    return { statut: "erreur", message: code ? MESSAGES[code] : "Impossible d'afficher le contact pour le moment." };
  }
  const contact = (data as Contact[] | null)?.[0];
  if (!contact) return { statut: "erreur", message: "Le bailleur n'a pas laissé de coordonnées." };
  return { statut: "ok", contact };
}

export async function basculerFavori(annonceId: number, ajouter: boolean) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false, message: "Connectez-vous pour enregistrer ce logement." };

  const { error } = ajouter
    ? await supabase.from("favoris").upsert({ annonce_id: annonceId }, { onConflict: "membre_id,annonce_id" })
    : await supabase.from("favoris").delete().eq("annonce_id", annonceId);
  if (error) return { ok: false, message: "L'enregistrement n'a pas fonctionné." };
  revalidatePath("/mon-espace");
  return { ok: true };
}

export type EtatSignalement = { statut: "repos" | "envoye" | "erreur"; message?: string };

export async function signaler(_etat: EtatSignalement, formData: FormData): Promise<EtatSignalement> {
  const annonceId = Number(formData.get("annonce_id"));
  const motif = String(formData.get("motif") ?? "");
  const details = String(formData.get("details") ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(annonceId) || !(motif in MOTIFS_SIGNALEMENT)) {
    return { statut: "erreur", message: "Choisissez un motif." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("signalements").insert({ annonce_id: annonceId, motif, details });
  if (error) return { statut: "erreur", message: "Le signalement n'a pas pu être envoyé." };
  return { statut: "envoye" };
}
