import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CAMPUS, TYPES_LOGEMENT, type AnnonceAvecPhotos } from "@/lib/annonces";

const CHAMPS = "*, photos(id, piece, ordre_piece, ordre, chemin, description_piece)";

export type Filtres = {
  campus?: string;
  budget?: number;
  type?: string;
  meuble?: boolean;
  apl?: boolean;
  metro?: boolean;
  animaux?: boolean;
  tri?: "recent" | "prix" | "trajet";
};

// Lit les filtres de l'adresse (?campus=r2&budget=500...) en ignorant les valeurs inconnues.
export function lireFiltres(params: Record<string, string | string[] | undefined>): Filtres {
  const un = (k: string) => (Array.isArray(params[k]) ? params[k]?.[0] : params[k]) as string | undefined;
  const budget = Number(un("budget"));
  const tri = un("tri");
  return {
    campus: CAMPUS.some((c) => c.id === un("campus")) ? un("campus") : undefined,
    budget: Number.isFinite(budget) && budget >= 100 ? budget : undefined,
    type: (TYPES_LOGEMENT as readonly string[]).includes(un("type") ?? "") ? un("type") : undefined,
    meuble: un("meuble") === "1" || undefined,
    apl: un("apl") === "1" || undefined,
    metro: un("metro") === "1" || undefined,
    animaux: un("animaux") === "1" || undefined,
    tri: tri === "prix" || tri === "trajet" ? tri : "recent",
  };
}

// Annonces visibles par tous (publiées), filtrées. Le budget porte sur le total charges comprises.
export async function annoncesPubliees(filtres: Filtres = {}, limite = 60) {
  const supabase = await createClient();
  let requete = supabase.from("annonces").select(CHAMPS).eq("statut", "publiee").limit(limite);

  if (filtres.campus) requete = requete.eq("campus", filtres.campus);
  if (filtres.type) requete = requete.eq("type_logement", filtres.type);
  if (filtres.meuble) requete = requete.eq("meuble", true);
  if (filtres.apl) requete = requete.eq("apl", true);
  if (filtres.metro) requete = requete.eq("proche_metro", true);
  if (filtres.animaux) requete = requete.eq("animaux", true);
  if (filtres.budget) requete = requete.lte("loyer", filtres.budget);

  if (filtres.tri === "prix") requete = requete.order("loyer", { ascending: true });
  else if (filtres.tri === "trajet") requete = requete.order("trajet_minutes", { ascending: true, nullsFirst: false });
  else requete = requete.order("publiee_le", { ascending: false });

  const { data, error } = await requete;
  if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);

  let annonces = (data ?? []) as AnnonceAvecPhotos[];
  // Le filtre « loyer » côté base est large ; on affine ici sur le total charges comprises.
  if (filtres.budget) annonces = annonces.filter((a) => a.loyer + a.charges <= filtres.budget!);
  if (filtres.tri === "prix") annonces.sort((a, b) => a.loyer + a.charges - (b.loyer + b.charges));
  return annonces;
}

// Une annonce, si la personne a le droit de la voir (règles RLS : publiée, la sienne, ou admin).
export async function uneAnnonce(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("annonces").select(CHAMPS).eq("id", id).maybeSingle();
  return (data as AnnonceAvecPhotos | null) ?? null;
}

export async function compterVue(id: number) {
  const supabase = await createClient();
  await supabase.rpc("compter_vue", { p_annonce: id });
}

export async function mesAnnonces(membreId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("annonces")
    .select(CHAMPS)
    .eq("auteur_id", membreId)
    .order("cree_le", { ascending: false });
  return (data ?? []) as AnnonceAvecPhotos[];
}

export async function mesFavoris() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favoris")
    .select(`annonce_id, annonces(${CHAMPS})`)
    .order("cree_le", { ascending: false });
  return (data ?? [])
    .map((f) => f.annonces as unknown as AnnonceAvecPhotos | null)
    .filter((a): a is AnnonceAvecPhotos => a !== null);
}

export async function estFavori(annonceId: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("favoris").select("annonce_id").eq("annonce_id", annonceId).maybeSingle();
  return Boolean(data);
}
