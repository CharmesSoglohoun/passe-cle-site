"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  changerMotDePasse,
  connecter,
  inscrire,
  motDePasseOublie,
  type EtatFormulaire,
} from "@/lib/actions-compte";

const REPOS: EtatFormulaire = { statut: "repos" };

function Erreur({ etat }: { etat: EtatFormulaire }) {
  if (etat.statut !== "erreur") return null;
  return (
    <p role="alert" className="rounded-xl bg-corail-doux p-3 text-sm">
      {etat.message}
    </p>
  );
}

function ChampMotDePasse({ nom = "mot_de_passe", libelle, nouveau }: { nom?: string; libelle: string; nouveau: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={nom} className="etiquette">
        {libelle}
      </label>
      <div className="relative">
        <input
          id={nom}
          name={nom}
          type={visible ? "text" : "password"}
          required
          minLength={nouveau ? 10 : undefined}
          autoComplete={nouveau ? "new-password" : "current-password"}
          className="champ pr-24"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-sm font-semibold text-sapin hover:bg-doux"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>
      {nouveau && <p className="mt-1 text-xs text-gris">Au moins 10 caractères, avec des lettres et des chiffres.</p>}
    </div>
  );
}

function ChampEmail({ defaut }: { defaut?: string }) {
  return (
    <div>
      <label htmlFor="email" className="etiquette">
        Adresse e-mail
      </label>
      <input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaut} className="champ" />
    </div>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(connecter, REPOS);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="suite" value={suite} />
      <ChampEmail defaut={etat.email} />
      <ChampMotDePasse libelle="Mot de passe" nouveau={false} />
      <Link href="/mot-de-passe-oublie" className="-mt-2 w-fit text-sm font-semibold text-sapin hover:underline">
        Mot de passe oublié ?
      </Link>
      <Erreur etat={etat} />
      <button type="submit" className="btn-sapin" disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(inscrire, REPOS);

  if (etat.statut === "ok") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-sapin-doux p-5">
        <h2 className="text-xl font-bold">Vérifiez votre boîte e-mail</h2>
        <p>
          Nous avons envoyé un lien de confirmation à <strong>{etat.email}</strong>. Cliquez dessus pour activer votre
          compte, puis connectez-vous.
        </p>
        <p className="text-sm text-gris">Rien reçu ? Regardez dans les courriers indésirables.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="prenom" className="etiquette">
          Prénom
        </label>
        <input id="prenom" name="prenom" required maxLength={60} autoComplete="given-name" className="champ" />
      </div>
      <ChampEmail defaut={etat.email} />
      <ChampMotDePasse libelle="Mot de passe" nouveau />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="conditions" required className="mt-0.5 size-5 shrink-0 accent-[var(--sapin)]" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/mentions-legales" className="font-semibold text-sapin underline" target="_blank">
            conditions d&apos;utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" className="font-semibold text-sapin underline" target="_blank">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      <Erreur etat={etat} />
      <button type="submit" className="btn-corail" disabled={enCours}>
        {enCours ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}

export function FormulaireOubli() {
  const [etat, action, enCours] = useActionState(motDePasseOublie, REPOS);
  if (etat.statut === "ok") {
    return (
      <p className="rounded-2xl bg-sapin-doux p-5">
        Si un compte existe pour <strong>{etat.email}</strong>, un lien pour choisir un nouveau mot de passe vient de lui
        être envoyé. Il est valable une heure.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <ChampEmail defaut={etat.email} />
      <Erreur etat={etat} />
      <button type="submit" className="btn-sapin" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}

export function FormulaireNouveauMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, REPOS);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ChampMotDePasse libelle="Nouveau mot de passe" nouveau />
      <ChampMotDePasse nom="confirmation" libelle="Confirmez le mot de passe" nouveau />
      <Erreur etat={etat} />
      <button type="submit" className="btn-sapin" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
