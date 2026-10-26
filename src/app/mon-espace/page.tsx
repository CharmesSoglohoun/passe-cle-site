import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CarteAnnonce } from "@/components/CarteAnnonce";
import { seDeconnecter } from "@/lib/actions-compte";
import { STATUTS, dateLongue, euros, photoPrincipale, titre, total, urlPhoto } from "@/lib/annonces";
import { mesAnnonces, mesFavoris } from "@/lib/requetes";
import { exigerMembre } from "@/lib/session";
import { supprimerMonCompte } from "./actions";
import { ActionsAnnonce, FormulaireProfil } from "./Interactions";

export const metadata: Metadata = { title: "Mon espace" };

const TONS = {
  attente: "bg-attente-doux text-attente",
  ok: "bg-sapin-doux text-sapin",
  refus: "bg-corail-doux text-corail",
  neutre: "bg-doux text-gris",
};

export default function PageMonEspace({ searchParams }: PageProps<"/mon-espace">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-gris">Chargement…</p>}>
        <Contenu searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/mon-espace">["searchParams"] }) {
  const [membre, params] = await Promise.all([exigerMembre(), searchParams]);
  const [annonces, favoris] = await Promise.all([mesAnnonces(membre.id), mesFavoris()]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-sapin font-titre text-xl font-extrabold text-sur-sapin">
          {(membre.prenom || membre.email)[0]?.toUpperCase()}
        </span>
        <div>
          <p className="text-gris">Bonjour</p>
          <h1 className="text-3xl font-extrabold">{membre.prenom || "et bienvenue"}</h1>
        </div>
        <form action={seDeconnecter} className="ml-auto">
          <button type="submit" className="btn-ligne">
            Se déconnecter
          </button>
        </form>
      </header>

      {params.publiee === "1" && (
        <p role="status" className="rounded-xl bg-sapin-doux p-4">
          <strong>Annonce envoyée !</strong> Elle sera relue par l&apos;équipe avant sa mise en ligne.
          {params.photos_manquantes ? ` Attention : ${params.photos_manquantes} photo(s) n'ont pas pu être envoyées.` : ""}
        </p>
      )}
      {params.mdp === "1" && (
        <p role="status" className="rounded-xl bg-sapin-doux p-4">
          Mot de passe modifié.
        </p>
      )}
      {membre.suspendu && (
        <p className="rounded-xl bg-corail-doux p-4">
          Votre compte est suspendu : vous ne pouvez plus publier. Contactez l&apos;équipe Passe-Clé si c&apos;est une erreur.
        </p>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Mes annonces</h2>
          <Link href="/publier" className="btn-corail min-h-10 text-sm">
            Publier un logement
          </Link>
        </div>
        {annonces.length ? (
          <ul className="flex flex-col gap-3">
            {annonces.map((a) => {
              const photo = photoPrincipale(a.photos);
              const s = STATUTS[a.statut];
              return (
                <li key={a.id} className="carte flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-doux sm:w-36">
                    {photo && <Image src={urlPhoto(photo.chemin)} alt="" fill sizes="144px" className="object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className={`badge w-fit ${TONS[s.ton]}`}>{s.libelle}</span>
                    <Link href={`/logements/${a.id}`} className="font-semibold hover:underline">
                      {titre(a)} · {a.quartier} · {euros(total(a))} CC
                    </Link>
                    <p className="text-sm text-gris">
                      Créée le {dateLongue(a.cree_le)} · {a.vues} vue{a.vues > 1 ? "s" : ""} · {a.photos.length} photo
                      {a.photos.length > 1 ? "s" : ""}
                    </p>
                    {a.statut === "refusee" && a.motif_moderation && (
                      <p className="text-sm text-corail">Motif du refus : {a.motif_moderation}</p>
                    )}
                  </div>
                  <ActionsAnnonce id={a.id} statut={a.statut} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gris">Vous n&apos;avez pas encore publié d&apos;annonce.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Logements enregistrés</h2>
        {favoris.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoris.map((a) => (
              <CarteAnnonce key={a.id} annonce={a} />
            ))}
          </div>
        ) : (
          <p className="text-gris">
            Touchez « Enregistrer » sur une annonce pour la retrouver ici.{" "}
            <Link href="/logements" className="font-semibold text-sapin hover:underline">
              Chercher un logement
            </Link>
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="carte p-5">
          <h2 className="mb-2 text-xl font-bold">Mon profil</h2>
          <p className="mb-4 text-sm text-gris">
            {membre.email}
            {membre.etudiant_verifie ? " · Étudiant vérifié" : ""}
          </p>
          <FormulaireProfil prenom={membre.prenom} etablissement={membre.etablissement} />
          <Link href="/mot-de-passe-oublie" className="mt-4 inline-block text-sm font-semibold text-sapin hover:underline">
            Changer mon mot de passe
          </Link>
        </div>

        <div className="carte flex flex-col gap-3 p-5">
          <h2 className="text-xl font-bold">Supprimer mon compte</h2>
          <p className="text-sm text-gris">
            Votre compte, vos annonces, leurs photos et vos logements enregistrés seront effacés définitivement.
          </p>
          {params.suppression === "refusee" && <p className="text-sm text-corail">Tapez SUPPRIMER pour confirmer.</p>}
          {params.suppression === "erreur" && (
            <p className="text-sm text-corail">La suppression n&apos;a pas fonctionné. Réessayez.</p>
          )}
          <form action={supprimerMonCompte} className="flex flex-col gap-3">
            <label htmlFor="confirmation" className="etiquette">
              Tapez SUPPRIMER pour confirmer
            </label>
            <input id="confirmation" name="confirmation" autoComplete="off" className="champ" />
            <button type="submit" className="btn w-fit border border-corail text-corail hover:bg-corail-doux">
              Supprimer définitivement
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
