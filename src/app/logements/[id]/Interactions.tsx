"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { MOTIFS_SIGNALEMENT } from "@/lib/annonces";
import { basculerFavori, signaler, voirContact, type EtatContact, type EtatSignalement } from "./actions";

export function BlocContact({ annonceId, connecte, exemple }: { annonceId: number; connecte: boolean; exemple: boolean }) {
  const [etat, setEtat] = useState<EtatContact>({ statut: "repos" });
  const [enCours, demarrer] = useTransition();

  if (!connecte) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gris">
          Pour protéger les bailleurs du démarchage, leurs coordonnées sont réservées aux membres connectés.
        </p>
        <Link href={`/connexion?suite=/logements/${annonceId}`} className="btn-sapin">
          Se connecter pour voir le contact
        </Link>
      </div>
    );
  }

  if (etat.statut === "ok" && etat.contact) {
    const c = etat.contact;
    return (
      <dl className="grid gap-2 text-sm">
        {exemple && <p className="badge w-fit bg-attente-doux text-attente">Coordonnées fictives (annonce d&apos;exemple)</p>}
        <div>
          <dt className="text-gris">Nom</dt>
          <dd className="font-semibold">{c.nom}</dd>
        </div>
        {c.telephone && (
          <div>
            <dt className="text-gris">Téléphone</dt>
            <dd>
              <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="font-semibold text-sapin underline">
                {c.telephone}
              </a>
            </dd>
          </div>
        )}
        {c.email && (
          <div>
            <dt className="text-gris">E-mail</dt>
            <dd>
              <a href={`mailto:${c.email}`} className="font-semibold text-sapin underline">
                {c.email}
              </a>
            </dd>
          </div>
        )}
        {c.conditions && (
          <div>
            <dt className="text-gris">Conditions demandées</dt>
            <dd className="whitespace-pre-line">{c.conditions}</dd>
          </div>
        )}
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="btn-sapin"
        disabled={enCours}
        onClick={() => demarrer(async () => setEtat(await voirContact(annonceId)))}
      >
        {enCours ? "Affichage…" : "Voir les coordonnées du bailleur"}
      </button>
      {etat.statut === "erreur" && (
        <p role="alert" className="text-sm text-corail">
          {etat.message}
        </p>
      )}
    </div>
  );
}

export function BoutonFavori({ annonceId, initial, connecte }: { annonceId: number; initial: boolean; connecte: boolean }) {
  const [favori, setFavori] = useState(initial);
  const [message, setMessage] = useState("");
  const [enCours, demarrer] = useTransition();

  if (!connecte) {
    return (
      <Link href={`/connexion?suite=/logements/${annonceId}`} className="btn-ligne">
        ♡ Enregistrer
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn-ligne"
        aria-pressed={favori}
        disabled={enCours}
        onClick={() =>
          demarrer(async () => {
            const r = await basculerFavori(annonceId, !favori);
            if (r.ok) setFavori(!favori);
            setMessage(r.ok ? "" : (r.message ?? ""));
          })
        }
      >
        {favori ? "♥ Enregistré" : "♡ Enregistrer"}
      </button>
      {message && <span className="text-sm text-corail">{message}</span>}
    </>
  );
}

export function FormulaireSignalement({ annonceId }: { annonceId: number }) {
  const [etat, action, enCours] = useActionState<EtatSignalement, FormData>(signaler, { statut: "repos" });

  if (etat.statut === "envoye") {
    return <p className="text-sm text-sapin">Merci, votre signalement a bien été transmis à l&apos;équipe.</p>;
  }

  return (
    <details>
      <summary className="cursor-pointer text-sm font-semibold text-gris hover:text-encre">Signaler l&apos;annonce</summary>
      <form action={action} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="annonce_id" value={annonceId} />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="etiquette">Pourquoi ?</legend>
          {Object.entries(MOTIFS_SIGNALEMENT).map(([valeur, libelle]) => (
            <label key={valeur} className="flex min-h-9 items-center gap-2 text-sm">
              <input type="radio" name="motif" value={valeur} required className="size-4 accent-[var(--corail)]" />
              {libelle}
            </label>
          ))}
        </fieldset>
        <label className="text-sm">
          <span className="etiquette">Précisions (facultatif)</span>
          <textarea name="details" maxLength={1000} rows={3} className="champ py-2" />
        </label>
        {etat.statut === "erreur" && (
          <p role="alert" className="text-sm text-corail">
            {etat.message}
          </p>
        )}
        <button type="submit" className="btn-ligne" disabled={enCours}>
          {enCours ? "Envoi…" : "Envoyer le signalement"}
        </button>
      </form>
    </details>
  );
}
