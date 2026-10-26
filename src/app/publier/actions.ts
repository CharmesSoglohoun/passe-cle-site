"use server";

import { revalidatePath } from "next/cache";
import { BAILLEURS, CAMPUS, EQUIPEMENTS, TYPES_LOGEMENT } from "@/lib/annonces";
import { createClient } from "@/lib/supabase/server";

export type ResultatCreation = { ok: true; id: number } | { ok: false; message: string };

const texte = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const entier = (f: FormData, k: string) => {
  const n = Number(String(f.get(k) ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
const coche = (f: FormData, k: string) => f.get(k) === "on";
const dans = <T extends string>(liste: readonly T[], v: string): v is T => (liste as readonly string[]).includes(v);

// Crée l'annonce (en attente de validation) et les coordonnées du bailleur.
// Les photos sont envoyées ensuite depuis le navigateur, directement dans le stockage.
export async function creerAnnonce(f: FormData): Promise<ResultatCreation> {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (!session?.claims) return { ok: false, message: "Votre session a expiré. Reconnectez-vous." };

  const type = texte(f, "type_logement", 40);
  const campus = texte(f, "campus", 20);
  const bailleurType = texte(f, "bailleur_type", 20);
  const dpe = texte(f, "dpe", 1);
  const disponible = texte(f, "disponible_le", 10);
  const equipements = f.getAll("equipements").map(String).filter((e) => dans(EQUIPEMENTS, e));

  const annonce = {
    type_logement: type,
    meuble: coche(f, "meuble"),
    surface: entier(f, "surface"),
    quartier: texte(f, "quartier", 80),
    etage: texte(f, "etage", 20),
    ascenseur: coche(f, "ascenseur") || equipements.includes("Ascenseur"),
    equipements,
    dpe: dpe ? dpe : null,
    animaux: coche(f, "animaux") || equipements.includes("Animaux acceptés"),
    proche_metro: coche(f, "proche_metro"),
    campus,
    trajet_minutes: f.get("trajet_minutes") ? entier(f, "trajet_minutes") : null,
    trajet_mode: texte(f, "trajet_mode", 40),
    loyer: entier(f, "loyer"),
    charges: f.get("charges") ? entier(f, "charges") : 0,
    depot: f.get("depot") ? entier(f, "depot") : 0,
    apl: coche(f, "apl"),
    disponible_le: disponible,
    sortant_prenom: texte(f, "sortant_prenom", 60),
    sortant_etablissement: texte(f, "sortant_etablissement", 120),
    description: texte(f, "description", 2000),
    ce_que_j_ai_aime: texte(f, "ce_que_j_ai_aime", 1000),
    ce_qu_il_faut_savoir: texte(f, "ce_qu_il_faut_savoir", 1000),
    bailleur_type: bailleurType,
    accord_bailleur: coche(f, "accord_bailleur"),
  };
  const contact = {
    nom: texte(f, "bailleur_nom", 120),
    telephone: texte(f, "bailleur_telephone", 30),
    email: texte(f, "bailleur_email", 160).toLowerCase(),
    conditions: texte(f, "bailleur_conditions", 1000),
  };

  // Mêmes règles que la base, avec des messages compréhensibles.
  if (!dans(TYPES_LOGEMENT, type)) return { ok: false, message: "Choisissez le type de logement." };
  if (!(annonce.surface >= 5 && annonce.surface <= 200)) return { ok: false, message: "La surface doit être comprise entre 5 et 200 m²." };
  if (annonce.quartier.length < 2) return { ok: false, message: "Indiquez le quartier." };
  if (!CAMPUS.some((c) => c.id === campus)) return { ok: false, message: "Choisissez le campus le plus proche." };
  if (annonce.trajet_minutes !== null && !(annonce.trajet_minutes >= 1 && annonce.trajet_minutes <= 120)) {
    return { ok: false, message: "Le temps de trajet doit être compris entre 1 et 120 minutes." };
  }
  if (dpe && !"ABCDEFG".includes(dpe)) return { ok: false, message: "Classe DPE inconnue." };
  if (!(annonce.loyer >= 50 && annonce.loyer <= 3000)) return { ok: false, message: "Le loyer doit être compris entre 50 et 3 000 €." };
  if (!(annonce.charges >= 0 && annonce.charges <= 1000)) return { ok: false, message: "Les charges doivent être comprises entre 0 et 1 000 €." };
  if (!(annonce.depot >= 0 && annonce.depot <= 6000)) return { ok: false, message: "Le dépôt de garantie semble incorrect." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(disponible)) return { ok: false, message: "Indiquez la date de disponibilité." };
  if (!dans(BAILLEURS, bailleurType)) return { ok: false, message: "Choisissez le type de bailleur." };
  if (contact.nom.length < 2) return { ok: false, message: "Indiquez le nom du bailleur." };
  if (!contact.telephone && !contact.email) return { ok: false, message: "Indiquez au moins un moyen de contacter le bailleur." };
  if (!annonce.accord_bailleur) {
    return { ok: false, message: "Cochez la case confirmant que votre bailleur accepte d'être contacté." };
  }

  const { data, error } = await supabase.from("annonces").insert(annonce).select("id").single();
  if (error || !data) {
    console.error("Création d'annonce :", error?.message);
    return { ok: false, message: "L'annonce n'a pas pu être enregistrée. Si votre compte est suspendu, contactez-nous." };
  }

  const { error: erreurContact } = await supabase.from("contacts_bailleur").insert({ annonce_id: data.id, ...contact });
  if (erreurContact) {
    await supabase.from("annonces").delete().eq("id", data.id);
    return { ok: false, message: "Les coordonnées du bailleur n'ont pas pu être enregistrées." };
  }

  revalidatePath("/mon-espace");
  return { ok: true, id: data.id };
}
