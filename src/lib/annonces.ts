// Vocabulaire commun du site : campus, types de logement, équipements, pièces de la visite.
// Les valeurs doivent rester alignées avec les contraintes « check » de supabase/migrations/0001_schema.sql.

export const CAMPUS = [
  { id: "r2", nom: "Rennes 2 Villejean" },
  { id: "r1", nom: "Rennes 1 Beaulieu" },
  { id: "centre", nom: "Centre-ville / Rennes 1 Droit-Éco" },
  { id: "kerlann", nom: "Ker Lann" },
  { id: "harpe", nom: "La Harpe / Rennes 2" },
  { id: "stjacques", nom: "Saint-Jacques / Rennes School of Business" },
  { id: "cesson", nom: "Cesson-Sévigné" },
] as const;

export type CampusId = (typeof CAMPUS)[number]["id"];

export const TYPES_LOGEMENT = [
  "Studio",
  "T1",
  "T2",
  "Colocation",
  "Chambre chez l'habitant",
  "Résidence étudiante",
] as const;

export const EQUIPEMENTS = [
  "Lit",
  "Bureau",
  "Lave-linge",
  "Fibre",
  "Cuisine équipée",
  "Ascenseur",
  "Animaux acceptés",
  "Local à vélos",
  "Parking",
] as const;

export const PIECES_PAR_DEFAUT = [
  "Entrée",
  "Pièce principale",
  "Cuisine",
  "Salle de bain",
  "Vue / extérieur",
  "Immeuble et parties communes",
] as const;

export const BAILLEURS = ["Particulier", "Agence", "Résidence"] as const;

export const DPE: Record<string, { fond: string; texte: string; largeur: number }> = {
  A: { fond: "#1F7A4D", texte: "#FFFFFF", largeur: 34 },
  B: { fond: "#3E9A55", texte: "#FFFFFF", largeur: 44 },
  C: { fond: "#9CC24A", texte: "#17201C", largeur: 54 },
  D: { fond: "#F2D23D", texte: "#17201C", largeur: 64 },
  E: { fond: "#F2A93D", texte: "#17201C", largeur: 74 },
  F: { fond: "#E8743A", texte: "#17201C", largeur: 84 },
  G: { fond: "#C7352B", texte: "#FFFFFF", largeur: 94 },
};

export const STATUTS: Record<string, { libelle: string; ton: "attente" | "ok" | "refus" | "neutre" }> = {
  en_attente: { libelle: "En attente de validation", ton: "attente" },
  publiee: { libelle: "En ligne", ton: "ok" },
  refusee: { libelle: "Refusée", ton: "refus" },
  retiree: { libelle: "Retirée", ton: "neutre" },
  attribuee: { libelle: "Logement attribué", ton: "neutre" },
};

export const MOTIFS_SIGNALEMENT = {
  arnaque: "Je pense que c'est une arnaque",
  annonce_fausse: "Les informations ou les photos sont fausses",
  deja_loue: "Le logement n'est plus disponible",
  contenu_inapproprie: "Contenu inapproprié",
  autre: "Autre raison",
} as const;

export type Annonce = {
  id: number;
  auteur_id: string | null;
  statut: keyof typeof STATUTS;
  motif_moderation: string | null;
  est_exemple: boolean;
  type_logement: string;
  meuble: boolean;
  surface: number;
  quartier: string;
  etage: string;
  ascenseur: boolean;
  equipements: string[];
  dpe: string | null;
  animaux: boolean;
  proche_metro: boolean;
  campus: CampusId;
  trajet_minutes: number | null;
  trajet_mode: string;
  loyer: number;
  charges: number;
  depot: number;
  apl: boolean;
  disponible_le: string;
  sortant_prenom: string;
  sortant_etablissement: string;
  description: string;
  ce_que_j_ai_aime: string;
  ce_qu_il_faut_savoir: string;
  bailleur_type: string;
  vues: number;
  cree_le: string;
  publiee_le: string | null;
};

export type Photo = {
  id: number;
  piece: string;
  ordre_piece: number;
  ordre: number;
  chemin: string;
  description_piece: string;
};

export type AnnonceAvecPhotos = Annonce & { photos: Photo[] };

export const nomCampus = (id: string) => CAMPUS.find((c) => c.id === id)?.nom ?? id;

export const total = (a: Pick<Annonce, "loyer" | "charges">) => a.loyer + a.charges;

export function titre(a: Pick<Annonce, "type_logement" | "meuble" | "surface">) {
  const accordable = !["Résidence étudiante", "Chambre chez l'habitant", "Colocation"].includes(a.type_logement);
  return `${a.type_logement}${a.meuble && accordable ? " meublé" : ""} · ${a.surface} m²`;
}

export const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const dateLongue = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(
    new Date(iso),
  );

// Adresse d'une photo : chemin local pour les annonces d'exemple, stockage Supabase sinon.
export function urlPhoto(chemin: string) {
  if (chemin.startsWith("/")) return chemin;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos-annonces/${chemin}`;
}

// Photos regroupées par pièce, dans l'ordre de la visite.
export function piecesDeLaVisite(photos: Photo[]) {
  const tri = [...photos].sort((a, b) => a.ordre_piece - b.ordre_piece || a.ordre - b.ordre);
  const pieces: { nom: string; description: string; photos: Photo[] }[] = [];
  for (const p of tri) {
    const derniere = pieces.at(-1);
    if (derniere && derniere.nom === p.piece) derniere.photos.push(p);
    else pieces.push({ nom: p.piece, description: p.description_piece, photos: [p] });
  }
  return pieces;
}

export const photoPrincipale = (photos: Photo[]) => {
  const pieces = piecesDeLaVisite(photos);
  // La pièce principale (2e étape) est la plus parlante, sinon la première photo venue.
  return (pieces[1] ?? pieces[0])?.photos[0];
};
