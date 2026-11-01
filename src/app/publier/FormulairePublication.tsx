"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BAILLEURS, CAMPUS, EQUIPEMENTS, PIECES_PAR_DEFAUT, TYPES_LOGEMENT } from "@/lib/annonces";
import { createClient } from "@/lib/supabase/client";
import { creerAnnonce } from "./actions";

const ETAPES = ["Le logement", "La visite virtuelle", "Le coût", "Le bailleur", "Votre mot"];
const MAX_PHOTOS_PIECE = 5;
const MAX_PHOTOS = 30;

type Piece = { cle: number; nom: string; description: string; fichiers: File[] };

// Réduit une photo à 1600 px de large au plus, en JPEG : envoi rapide depuis un téléphone,
// et les métadonnées (dont la position GPS) disparaissent au passage.
async function compresser(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * echelle);
  canvas.height = Math.round(image.height * echelle);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return new Promise((ok, ko) =>
    canvas.toBlob((b) => (b ? ok(b) : ko(new Error("Compression impossible"))), "image/jpeg", 0.82),
  );
}

export function FormulairePublication({ membreId, prenom, etablissement }: { membreId: string; prenom: string; etablissement: string }) {
  const router = useRouter();
  const formulaire = useRef<HTMLFormElement>(null);
  const [etape, setEtape] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>(
    PIECES_PAR_DEFAUT.map((nom, i) => ({ cle: i, nom, description: "", fichiers: [] })),
  );
  const [erreur, setErreur] = useState("");
  const [progression, setProgression] = useState<string | null>(null);

  const nbPhotos = pieces.reduce((n, p) => n + p.fichiers.length, 0);

  function majPiece(cle: number, changement: Partial<Piece>) {
    setPieces((ps) => ps.map((p) => (p.cle === cle ? { ...p, ...changement } : p)));
  }

  function deplacer(index: number, sens: -1 | 1) {
    setPieces((ps) => {
      const copie = [...ps];
      const cible = index + sens;
      if (cible < 0 || cible >= copie.length) return ps;
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  // Vérifie les champs de l'étape affichée avant de passer à la suivante.
  function etapeValide() {
    const bloc = formulaire.current?.querySelector<HTMLFieldSetElement>(`[data-etape="${etape}"]`);
    const champs = bloc ? Array.from(bloc.querySelectorAll<HTMLInputElement>("input, select, textarea")) : [];
    const invalide = champs.find((c) => !c.checkValidity());
    if (invalide) {
      invalide.reportValidity();
      return false;
    }
    if (etape === 1 && nbPhotos < 3) {
      setErreur("Ajoutez au moins 3 photos : c'est ce qui rassure le plus ceux qui cherchent.");
      return false;
    }
    setErreur("");
    return true;
  }

  async function publier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!etapeValide()) return;
    if (etape < ETAPES.length - 1) return setEtape(etape + 1);

    setErreur("");
    setProgression("Enregistrement de l'annonce…");
    const resultat = await creerAnnonce(new FormData(e.currentTarget));
    if (!resultat.ok) {
      setProgression(null);
      setErreur(resultat.message);
      return;
    }

    const supabase = createClient();
    let envoyees = 0;
    let echecs = 0;
    for (const [ordrePiece, piece] of pieces.entries()) {
      for (const [ordre, fichier] of piece.fichiers.entries()) {
        setProgression(`Envoi des photos : ${envoyees + echecs + 1} sur ${nbPhotos}…`);
        try {
          const blob = await compresser(fichier);
          const chemin = `${membreId}/${resultat.id}/${ordrePiece}-${ordre}-${crypto.randomUUID().slice(0, 8)}.jpg`;
          const { error: erreurEnvoi } = await supabase.storage
            .from("photos-annonces")
            .upload(chemin, blob, { contentType: "image/jpeg", upsert: false });
          if (erreurEnvoi) throw erreurEnvoi;
          const { error: erreurLigne } = await supabase.from("photos").insert({
            annonce_id: resultat.id,
            piece: piece.nom.trim() || `Pièce ${ordrePiece + 1}`,
            ordre_piece: ordrePiece,
            ordre,
            chemin,
            description_piece: piece.description.trim().slice(0, 300),
          });
          if (erreurLigne) throw erreurLigne;
          envoyees++;
        } catch (err) {
          console.error("Photo non envoyée :", err);
          echecs++;
        }
      }
    }

    router.push(`/mon-espace?publiee=1${echecs ? `&photos_manquantes=${echecs}` : ""}`);
    router.refresh();
  }

  return (
    <form ref={formulaire} onSubmit={publier} noValidate className="flex flex-col gap-6">
      <ol className="flex gap-1.5" aria-label="Étapes">
        {ETAPES.map((nom, i) => (
          <li
            key={nom}
            aria-current={i === etape ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-sapin" : "bg-trait"}`}
          >
            <span className="sr-only">
              Étape {i + 1} : {nom}
            </span>
          </li>
        ))}
      </ol>
      <div>
        <p className="text-sm font-semibold text-gris">
          Étape {etape + 1} sur {ETAPES.length}
        </p>
        <h2 className="text-2xl font-semibold">{ETAPES[etape]}</h2>
      </div>

      {/* 1. Le logement */}
      <fieldset data-etape="0" hidden={etape !== 0} className="grid gap-4 sm:grid-cols-2">
        <Choix nom="type_logement" libelle="Type de logement" options={TYPES_LOGEMENT} requis />
        <Nombre nom="surface" libelle="Surface (m²)" min={5} max={200} requis />
        <Texte nom="quartier" libelle="Quartier" exemple="Villejean, Beaulieu, Sainte-Anne…" requis max={80} />
        <Texte nom="etage" libelle="Étage" exemple="3e, RDC…" max={20} />
        <div className="sm:col-span-2">
          <Choix nom="campus" libelle="Campus le plus proche" options={CAMPUS.map((c) => c.id)} libelles={CAMPUS.map((c) => c.nom)} requis />
        </div>
        <Nombre nom="trajet_minutes" libelle="Temps de trajet (minutes)" min={1} max={120} />
        <Texte nom="trajet_mode" libelle="Comment ?" exemple="à pied, en métro A, à vélo…" max={40} />
        <Choix nom="dpe" libelle="Classe énergie (DPE)" options={["A", "B", "C", "D", "E", "F", "G"]} vide="Je ne sais pas" />
        <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
          <legend className="etiquette">Le logement est…</legend>
          <Case nom="meuble" libelle="Meublé" />
          <Case nom="proche_metro" libelle="À moins de 10 minutes à pied d'un métro" />
        </fieldset>
        <fieldset className="grid grid-cols-2 gap-1.5 sm:col-span-2 sm:grid-cols-3">
          <legend className="etiquette">Équipements</legend>
          {EQUIPEMENTS.map((e) => (
            <label key={e} className="flex min-h-9 items-center gap-2">
              <input type="checkbox" name="equipements" value={e} className="size-5 accent-[var(--sapin)]" />
              {e}
            </label>
          ))}
        </fieldset>
      </fieldset>

      {/* 2. La visite virtuelle */}
      <fieldset data-etape="1" hidden={etape !== 1} className="flex flex-col gap-4">
        <div className="rounded-2xl bg-sapin-doux p-4 text-sm">
          <p className="font-semibold">Pour de belles photos</p>
          <p>Lumière du jour, pièce rangée, photo prise depuis un coin pour montrer toute la pièce. Jusqu&apos;à {MAX_PHOTOS_PIECE} photos par pièce.</p>
        </div>
        {pieces.map((p, i) => (
          <div key={p.cle} className="carte flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <span className="font-titre text-2xl font-semibold text-or">{i + 1}</span>
              <input
                aria-label={`Nom de la pièce ${i + 1}`}
                value={p.nom}
                maxLength={60}
                onChange={(e) => majPiece(p.cle, { nom: e.target.value })}
                className="champ font-semibold"
              />
              <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter la pièce" className="btn-ligne min-h-10 px-3">
                ↑
              </button>
              <button type="button" onClick={() => deplacer(i, 1)} disabled={i === pieces.length - 1} aria-label="Descendre la pièce" className="btn-ligne min-h-10 px-3">
                ↓
              </button>
            </div>
            <input
              aria-label={`Description de ${p.nom}`}
              placeholder="Une phrase sur cette pièce (facultatif)"
              value={p.description}
              maxLength={300}
              onChange={(e) => majPiece(p.cle, { description: e.target.value })}
              className="champ text-sm"
            />
            <label className="btn-ligne w-fit cursor-pointer text-sm">
              + Ajouter des photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const ajout = Array.from(e.target.files ?? []);
                  const place = Math.min(MAX_PHOTOS_PIECE - p.fichiers.length, MAX_PHOTOS - nbPhotos);
                  majPiece(p.cle, { fichiers: [...p.fichiers, ...ajout.slice(0, Math.max(0, place))] });
                  e.target.value = "";
                }}
              />
            </label>
            {p.fichiers.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {p.fichiers.map((f, j) => (
                  <li key={f.name + j} className="flex items-center gap-1 rounded-lg bg-doux py-1 pl-2 pr-1 text-xs">
                    <span className="max-w-32 truncate">{f.name}</span>
                    <button
                      type="button"
                      aria-label={`Retirer ${f.name}`}
                      onClick={() => majPiece(p.cle, { fichiers: p.fichiers.filter((_, k) => k !== j) })}
                      className="grid size-6 place-items-center rounded-full hover:bg-trait"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pieces.length > 1 && (
              <button
                type="button"
                onClick={() => setPieces((ps) => ps.filter((x) => x.cle !== p.cle))}
                className="w-fit text-sm text-gris hover:text-corail"
              >
                Supprimer cette pièce
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn-ligne w-fit"
          onClick={() => setPieces((ps) => [...ps, { cle: Date.now(), nom: "Autre pièce", description: "", fichiers: [] }])}
        >
          + Ajouter une pièce
        </button>
        <p className="text-sm text-gris">
          {nbPhotos} photo{nbPhotos > 1 ? "s" : ""} sur {MAX_PHOTOS} au maximum.
        </p>
      </fieldset>

      {/* 3. Le coût */}
      <fieldset data-etape="2" hidden={etape !== 2} className="grid gap-4 sm:grid-cols-2">
        <Nombre nom="loyer" libelle="Loyer hors charges (€ / mois)" min={50} max={3000} requis />
        <Nombre nom="charges" libelle="Charges (€ / mois)" min={0} max={1000} />
        <Nombre nom="depot" libelle="Dépôt de garantie (€)" min={0} max={6000} />
        <div>
          <label htmlFor="disponible_le" className="etiquette">
            Disponible à partir du
          </label>
          <input id="disponible_le" name="disponible_le" type="date" required className="champ" />
        </div>
        <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
          <legend className="etiquette">Aides</legend>
          <Case nom="apl" libelle="Le logement est éligible aux APL" />
        </fieldset>
      </fieldset>

      {/* 4. Le bailleur */}
      <fieldset data-etape="3" hidden={etape !== 3} className="grid gap-4 sm:grid-cols-2">
        <p className="rounded-2xl bg-doux p-4 text-sm sm:col-span-2">
          Ces coordonnées ne seront <strong>jamais affichées publiquement</strong> : seuls les membres connectés peuvent
          les voir, et chaque consultation est enregistrée.
        </p>
        <Choix nom="bailleur_type" libelle="Le bailleur est" options={BAILLEURS} requis />
        <Texte nom="bailleur_nom" libelle="Nom du bailleur ou de l'agence" requis max={120} />
        <Texte nom="bailleur_telephone" libelle="Téléphone" type="tel" max={30} />
        <Texte nom="bailleur_email" libelle="E-mail" type="email" max={160} />
        <div className="sm:col-span-2">
          <label htmlFor="bailleur_conditions" className="etiquette">
            Conditions demandées
          </label>
          <textarea
            id="bailleur_conditions"
            name="bailleur_conditions"
            rows={3}
            maxLength={1000}
            placeholder="Garant, Visale acceptée, pièces du dossier…"
            className="champ py-2"
          />
        </div>
        <label className="flex items-start gap-2 rounded-2xl border border-corail p-4 sm:col-span-2">
          <input type="checkbox" name="accord_bailleur" required className="mt-0.5 size-5 shrink-0 accent-[var(--corail)]" />
          <span>J&apos;ai informé mon bailleur et il accepte d&apos;être contacté via Passe-Clé.</span>
        </label>
      </fieldset>

      {/* 5. Votre mot */}
      <fieldset data-etape="4" hidden={etape !== 4} className="grid gap-4 sm:grid-cols-2">
        <Texte nom="sortant_prenom" libelle="Votre prénom" defaut={prenom} max={60} />
        <Texte nom="sortant_etablissement" libelle="Votre établissement" defaut={etablissement} max={120} />
        <Zone nom="description" libelle="Présentation du logement" max={2000} />
        <Zone nom="ce_que_j_ai_aime" libelle="Ce que j'ai aimé" max={1000} />
        <Zone nom="ce_qu_il_faut_savoir" libelle="Ce qu'il faut savoir" max={1000} />
        <p className="text-sm text-gris sm:col-span-2">
          Votre annonce sera relue par l&apos;équipe avant d&apos;être mise en ligne, en général sous 48 heures.
        </p>
      </fieldset>

      {erreur && (
        <p role="alert" className="rounded-xl bg-corail-doux p-3 text-sm">
          {erreur}
        </p>
      )}
      {progression && (
        <p role="status" className="rounded-xl bg-sapin-doux p-3 text-sm">
          {progression}
        </p>
      )}

      <div className="flex justify-between gap-3">
        <button type="button" className="btn-ligne" disabled={etape === 0 || Boolean(progression)} onClick={() => setEtape(etape - 1)}>
          Retour
        </button>
        <button type="submit" className={etape === ETAPES.length - 1 ? "btn-corail" : "btn-sapin"} disabled={Boolean(progression)}>
          {etape === ETAPES.length - 1 ? "Envoyer pour validation" : "Suivant"}
        </button>
      </div>
    </form>
  );
}

function Texte(props: { nom: string; libelle: string; exemple?: string; requis?: boolean; max: number; type?: string; defaut?: string }) {
  return (
    <div>
      <label htmlFor={props.nom} className="etiquette">
        {props.libelle}
      </label>
      <input
        id={props.nom}
        name={props.nom}
        type={props.type ?? "text"}
        required={props.requis}
        maxLength={props.max}
        placeholder={props.exemple}
        defaultValue={props.defaut}
        className="champ"
      />
    </div>
  );
}

function Nombre({ nom, libelle, min, max, requis }: { nom: string; libelle: string; min: number; max: number; requis?: boolean }) {
  return (
    <div>
      <label htmlFor={nom} className="etiquette">
        {libelle}
      </label>
      <input id={nom} name={nom} type="number" inputMode="numeric" min={min} max={max} required={requis} className="champ" />
    </div>
  );
}

function Choix(props: { nom: string; libelle: string; options: readonly string[]; libelles?: string[]; requis?: boolean; vide?: string }) {
  return (
    <div>
      <label htmlFor={props.nom} className="etiquette">
        {props.libelle}
      </label>
      <select id={props.nom} name={props.nom} required={props.requis} defaultValue="" className="champ">
        <option value="" disabled={props.requis}>
          {props.vide ?? "Choisir…"}
        </option>
        {props.options.map((o, i) => (
          <option key={o} value={o}>
            {props.libelles?.[i] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Case({ nom, libelle }: { nom: string; libelle: string }) {
  return (
    <label className="flex min-h-9 items-center gap-2">
      <input type="checkbox" name={nom} className="size-5 accent-[var(--sapin)]" />
      {libelle}
    </label>
  );
}

function Zone({ nom, libelle, max }: { nom: string; libelle: string; max: number }) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor={nom} className="etiquette">
        {libelle}
      </label>
      <textarea id={nom} name={nom} rows={3} maxLength={max} className="champ py-2" />
    </div>
  );
}
