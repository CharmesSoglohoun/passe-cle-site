import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { STATUTS, dateLongue, euros, nomCampus, piecesDeLaVisite, titre, total, urlPhoto, type AnnonceAvecPhotos } from "@/lib/annonces";
import { exigerAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { modererAnnonce, supprimerAnnonceAdmin } from "../actions";

const ONGLETS = ["en_attente", "publiee", "refusee", "retiree", "attribuee"] as const;

export default function AdminAnnonces({ searchParams }: PageProps<"/admin/annonces">) {
  return (
    <Suspense fallback={<p className="text-gris">Chargement…</p>}>
      <Contenu searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/admin/annonces">["searchParams"] }) {
  await exigerAdmin();
  const params = await searchParams;
  const statut = ONGLETS.find((o) => o === params.statut) ?? "en_attente";

  const supabase = await createClient();
  const { data } = await supabase
    .from("annonces")
    .select("*, photos(id, piece, ordre_piece, ordre, chemin, description_piece), contacts_bailleur(nom, telephone, email, conditions), profils(prenom)")
    .eq("statut", statut)
    .order("cree_le", { ascending: statut === "en_attente" })
    .limit(100);

  type Ligne = AnnonceAvecPhotos & {
    contacts_bailleur: { nom: string; telephone: string; email: string; conditions: string } | null;
    profils: { prenom: string } | null;
  };
  const annonces = (data ?? []) as Ligne[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold">Annonces</h1>
      <nav aria-label="Statut" className="flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <Link
            key={o}
            href={`/admin/annonces?statut=${o}`}
            aria-current={o === statut ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${o === statut ? "bg-sapin text-sur-sapin" : "bg-doux hover:bg-trait"}`}
          >
            {STATUTS[o].libelle}
          </Link>
        ))}
      </nav>

      {!annonces.length && <p className="text-gris">Aucune annonce dans cette catégorie.</p>}

      <ul className="flex flex-col gap-6">
        {annonces.map((a) => {
          const pieces = piecesDeLaVisite(a.photos);
          const c = a.contacts_bailleur;
          return (
            <li key={a.id} className="carte flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-xl font-bold">
                  <Link href={`/logements/${a.id}`} className="hover:underline">
                    #{a.id} · {titre(a)} · {a.quartier}
                  </Link>
                </h2>
                {a.est_exemple && <span className="badge bg-attente-doux text-attente">Exemple</span>}
                <span className="text-sm text-gris">
                  par {a.profils?.prenom || "?"} · créée le {dateLongue(a.cree_le)} · {a.vues} vues
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {a.photos.length === 0 && <p className="text-sm text-corail">Aucune photo</p>}
                {pieces.flatMap((p) =>
                  p.photos.map((ph) => (
                    <a key={ph.id} href={urlPhoto(ph.chemin)} target="_blank" rel="noreferrer" className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-doux">
                      <Image src={urlPhoto(ph.chemin)} alt={p.nom} fill sizes="128px" className="object-cover" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[11px] text-white">{p.nom}</span>
                    </a>
                  )),
                )}
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <Info k="Coût" v={`${euros(a.loyer)} + ${euros(a.charges)} = ${euros(total(a))} CC · dépôt ${euros(a.depot)}`} />
                <Info k="Disponible" v={`${dateLongue(a.disponible_le)}${a.apl ? " · APL" : ""}`} />
                <Info k="Campus" v={`${nomCampus(a.campus)}${a.trajet_minutes ? ` · ${a.trajet_minutes} min ${a.trajet_mode}` : ""}`} />
                <Info k="Bailleur" v={c ? `${a.bailleur_type} · ${c.nom} · ${c.telephone} ${c.email}` : "Aucun contact"} />
                <Info k="Conditions" v={c?.conditions || "-"} />
                <Info k="Sortant" v={`${a.sortant_prenom || "-"} · ${a.sortant_etablissement || "-"}`} />
              </dl>
              {(a.description || a.ce_que_j_ai_aime || a.ce_qu_il_faut_savoir) && (
                <div className="rounded-xl bg-doux p-3 text-sm">
                  {[a.description, a.ce_que_j_ai_aime, a.ce_qu_il_faut_savoir].filter(Boolean).map((t, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {t}
                    </p>
                  ))}
                </div>
              )}
              {a.motif_moderation && <p className="text-sm text-corail">Motif enregistré : {a.motif_moderation}</p>}

              <div className="flex flex-wrap items-end gap-3 border-t border-trait pt-4">
                {statut !== "publiee" && (
                  <form action={modererAnnonce}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="statut" value="publiee" />
                    <button type="submit" className="btn-sapin">
                      Publier
                    </button>
                  </form>
                )}
                <form action={modererAnnonce} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <div>
                    <label htmlFor={`motif-${a.id}`} className="etiquette">
                      Motif (visible par l&apos;auteur)
                    </label>
                    <input id={`motif-${a.id}`} name="motif" maxLength={500} placeholder="Photos floues, prix incohérent…" className="champ w-64" />
                  </div>
                  <button type="submit" name="statut" value="refusee" className="btn-ligne">
                    Refuser
                  </button>
                  {statut === "publiee" && (
                    <button type="submit" name="statut" value="retiree" className="btn-ligne">
                      Retirer du site
                    </button>
                  )}
                </form>
                <form action={supprimerAnnonceAdmin} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="btn text-corail hover:bg-corail-doux">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-gris">{k}</dt>
      <dd className="break-words font-medium">{v}</dd>
    </div>
  );
}
