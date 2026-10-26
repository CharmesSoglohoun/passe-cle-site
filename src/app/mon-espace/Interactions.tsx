"use client";

import { useActionState, useTransition } from "react";
import { changerStatut, majProfil, supprimerAnnonce, type EtatProfil } from "./actions";

export function FormulaireProfil({ prenom, etablissement }: { prenom: string; etablissement: string }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(majProfil, { statut: "repos" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="prenom" className="etiquette">
          Prénom
        </label>
        <input id="prenom" name="prenom" defaultValue={prenom} required maxLength={60} className="champ" />
      </div>
      <div>
        <label htmlFor="etablissement" className="etiquette">
          Établissement
        </label>
        <input
          id="etablissement"
          name="etablissement"
          defaultValue={etablissement}
          maxLength={120}
          placeholder="Université Rennes 2…"
          className="champ"
        />
      </div>
      {etat.statut === "erreur" && (
        <p role="alert" className="text-sm text-corail">
          {etat.message}
        </p>
      )}
      {etat.statut === "ok" && (
        <p role="status" className="text-sm text-sapin">
          Profil enregistré.
        </p>
      )}
      <button type="submit" className="btn-sapin w-fit" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

export function ActionsAnnonce({ id, statut }: { id: number; statut: string }) {
  const [enCours, demarrer] = useTransition();
  const statutVers = (s: "retiree" | "attribuee" | "publiee") =>
    demarrer(async () => {
      await changerStatut(id, s);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {statut === "publiee" && (
        <button type="button" className="btn-ligne min-h-9 text-sm" disabled={enCours} onClick={() => statutVers("attribuee")}>
          Marquer comme attribué
        </button>
      )}
      {statut === "attribuee" && (
        <button type="button" className="btn-ligne min-h-9 text-sm" disabled={enCours} onClick={() => statutVers("publiee")}>
          Remettre en ligne
        </button>
      )}
      {(statut === "publiee" || statut === "en_attente") && (
        <button type="button" className="btn-ligne min-h-9 text-sm" disabled={enCours} onClick={() => statutVers("retiree")}>
          Retirer
        </button>
      )}
      <button
        type="button"
        className="btn min-h-9 text-sm text-corail hover:bg-corail-doux"
        disabled={enCours}
        onClick={() => {
          if (confirm("Supprimer définitivement cette annonce et ses photos ?")) {
            demarrer(async () => {
              await supprimerAnnonce(id);
            });
          }
        }}
      >
        Supprimer
      </button>
    </div>
  );
}
