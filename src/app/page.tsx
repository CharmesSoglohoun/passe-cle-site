import Link from "next/link";
import { Suspense } from "react";
import { CarteAnnonce } from "@/components/CarteAnnonce";
import { FormulaireRecherche } from "@/components/FormulaireRecherche";
import { CAMPUS } from "@/lib/annonces";
import { annoncesPubliees } from "@/lib/requetes";

export default function Accueil() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-sapin-fonce text-white">
        {/* Halos décoratifs émeraude et pêche */}
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[520px] rounded-full bg-peche/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-24 -z-10 size-[480px] rounded-full bg-[#1fa77a]/35 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <p className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-[#ffd2bd] backdrop-blur">
              Logement étudiant à Rennes
            </p>
            <h1 className="text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
              Le logement de ceux qui partent,{" "}
              <em className="font-medium text-peche">pour ceux qui arrivent.</em>
            </h1>
            <p className="max-w-xl text-lg text-white/75">
              Visitez chaque logement pièce par pièce, connaissez le coût réel avant de vous déplacer, et contactez le
              bailleur en confiance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/logements" className="btn-corail">
                Je cherche un logement
              </Link>
              <Link href="/publier" className="btn border border-white/30 text-white hover:bg-white/10">
                Je libère mon logement
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-white/70">
              {["Visite pièce par pièce", "Coût réel affiché", "Annonces vérifiées"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-peche" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="carte p-6 text-encre shadow-2xl shadow-black/30 sm:p-7">
            <h2 className="mb-1 text-2xl font-semibold">Trouver près de mon campus</h2>
            <p className="mb-5 text-sm text-gris">Choisissez votre campus et votre budget.</p>
            <FormulaireRecherche />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-corail">Par campus</p>
        <h2 className="mb-5 text-3xl font-semibold">Où étudiez-vous ?</h2>
        <ul className="flex flex-wrap gap-2.5">
          {CAMPUS.map((c) => (
            <li key={c.id}>
              <Link
                href={`/logements?campus=${c.id}`}
                className="btn min-h-10 border border-trait bg-carte text-sm hover:border-sapin hover:bg-sapin-doux hover:text-sapin"
              >
                {c.nom}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-corail">À la une</p>
            <h2 className="text-3xl font-semibold">Derniers logements</h2>
          </div>
          <Link href="/logements" className="whitespace-nowrap font-semibold text-sapin hover:underline">
            Tout voir →
          </Link>
        </div>
        <Suspense fallback={<GrilleVide />}>
          <DernieresAnnonces />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-corail">Simple et sûr</p>
        <h2 className="mb-6 text-3xl font-semibold">Comment ça marche</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ["Je cherche", "Filtrez par campus et budget, puis visitez chaque logement pièce par pièce, depuis chez vous."],
            ["Je contacte", "Une fois connecté, affichez les coordonnées du bailleur et écrivez à l'étudiant qui part."],
            ["Je libère", "Vous partez ? Publiez votre logement en 10 minutes. Chaque annonce est vérifiée avant sa mise en ligne."],
          ].map(([t, d], i) => (
            <li key={t} className="carte flex flex-col gap-3 p-6">
              <span className="grid size-11 place-items-center rounded-full bg-corail-doux font-titre text-xl font-semibold text-corail">
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold">{t}</h3>
              <p className="text-gris">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="relative overflow-hidden rounded-3xl bg-sapin-doux p-7 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-peche/25 blur-2xl" />
          <h2 className="relative max-w-2xl text-2xl font-semibold">
            Ne versez jamais d&apos;argent avant d&apos;avoir visité ou signé un bail.
          </h2>
          <p className="relative mt-2 max-w-2xl text-gris">
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
        <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-doux" />
      ))}
    </div>
  );
}
