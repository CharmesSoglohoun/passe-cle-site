import Link from "next/link";
import { Suspense } from "react";
import { CarteAnnonce } from "@/components/CarteAnnonce";
import { FormulaireRecherche } from "@/components/FormulaireRecherche";
import { CAMPUS } from "@/lib/annonces";
import { annoncesPubliees } from "@/lib/requetes";

export default function Accueil() {
  return (
    <>
      <section className="bg-doux">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-corail">Logement étudiant à Rennes</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Le logement de ceux qui partent, pour ceux qui arrivent.
            </h1>
            <p className="max-w-xl text-lg text-gris">
              Visitez chaque logement pièce par pièce, connaissez le coût réel avant de vous déplacer, et contactez le
              bailleur en confiance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/logements" className="btn-corail">
                Je cherche un logement
              </Link>
              <Link href="/publier" className="btn-ligne">
                Je libère mon logement
              </Link>
            </div>
          </div>
          <div className="carte p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Trouver près de mon campus</h2>
            <FormulaireRecherche />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-2xl font-bold">Par campus</h2>
        <ul className="flex flex-wrap gap-2">
          {CAMPUS.map((c) => (
            <li key={c.id}>
              <Link href={`/logements?campus=${c.id}`} className="btn-ligne min-h-10 text-sm">
                {c.nom}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Derniers logements</h2>
          <Link href="/logements" className="font-semibold text-sapin hover:underline">
            Tout voir
          </Link>
        </div>
        <Suspense fallback={<GrilleVide />}>
          <DernieresAnnonces />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold">Comment ça marche</h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            ["Je cherche", "Filtrez par campus et budget, puis visitez chaque logement pièce par pièce, depuis chez vous."],
            ["Je contacte", "Une fois connecté, affichez les coordonnées du bailleur et écrivez à l'étudiant qui part."],
            ["Je libère", "Vous partez ? Publiez votre logement en 10 minutes. Chaque annonce est vérifiée avant sa mise en ligne."],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2">
              <span className="font-titre text-5xl font-extrabold leading-none text-or">{i + 1}</span>
              <h3 className="text-lg font-bold">{t}</h3>
              <p className="text-gris">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="carte flex flex-col gap-2 bg-sapin-doux p-6">
          <h2 className="text-xl font-bold">Ne versez jamais d&apos;argent avant d&apos;avoir visité ou signé un bail.</h2>
          <p className="text-gris">
            Chaque annonce est relue avant publication et les coordonnées des bailleurs ne sont visibles que par les
            membres connectés. Un doute sur une annonce ? Signalez-la depuis sa fiche.
          </p>
        </div>
      </section>
    </>
  );
}

async function DernieresAnnonces() {
  const annonces = await annoncesPubliees({}, 6);
  if (!annonces.length) {
    return <p className="text-gris">Aucun logement en ligne pour le moment. Revenez bientôt !</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {annonces.map((a, i) => (
        <CarteAnnonce key={a.id} annonce={a} prioritaire={i < 3} />
      ))}
    </div>
  );
}

function GrilleVide() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-doux" />
      ))}
    </div>
  );
}
