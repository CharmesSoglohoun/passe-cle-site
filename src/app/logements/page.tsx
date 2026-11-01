import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CarteAnnonce } from "@/components/CarteAnnonce";
import { CAMPUS, TYPES_LOGEMENT, nomCampus } from "@/lib/annonces";
import { annoncesPubliees, lireFiltres, type Filtres } from "@/lib/requetes";

export const metadata: Metadata = { title: "Chercher un logement" };

export default function PageLogements({ searchParams }: PageProps<"/logements">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<p className="text-gris">Chargement des logements…</p>}>
        <Resultats searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Resultats({ searchParams }: { searchParams: PageProps<"/logements">["searchParams"] }) {
  const filtres = lireFiltres(await searchParams);
  const annonces = await annoncesPubliees(filtres);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside>
        <details className="carte p-4" open>
          <summary className="cursor-pointer font-titre text-lg font-bold">
            Filtres
          </summary>
          <FormulaireFiltres filtres={filtres} />
        </details>
      </aside>

      <section aria-live="polite">
        <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">
          {annonces.length} logement{annonces.length > 1 ? "s" : ""}
          {filtres.campus ? ` près de ${nomCampus(filtres.campus)}` : " à Rennes"}
        </h1>
        <p className="mb-6 text-gris">
          {filtres.budget ? `Jusqu'à ${filtres.budget} € charges comprises. ` : ""}
          Toutes les annonces sont relues avant leur mise en ligne.
        </p>
        {annonces.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {annonces.map((a, i) => (
              <CarteAnnonce key={a.id} annonce={a} prioritaire={i < 2} />
            ))}
          </div>
        ) : (
          <div className="carte flex flex-col items-start gap-3 p-6">
            <p>Aucun logement ne correspond à ces critères pour le moment.</p>
            <Link href="/logements" className="btn-ligne">
              Effacer les filtres
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function FormulaireFiltres({ filtres }: { filtres: Filtres }) {
  const cases: [keyof Filtres, string][] = [
    ["meuble", "Meublé"],
    ["apl", "Éligible APL"],
    ["metro", "Proche du métro"],
    ["animaux", "Animaux acceptés"],
  ];
  return (
    <form action="/logements" className="mt-4 flex flex-col gap-4">
      <div>
        <label htmlFor="f-campus" className="etiquette">
          Campus
        </label>
        <select id="f-campus" name="campus" defaultValue={filtres.campus ?? ""} className="champ">
          <option value="">Tous</option>
          {CAMPUS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-budget" className="etiquette">
          Budget max CC (€)
        </label>
        <input
          id="f-budget"
          name="budget"
          type="number"
          inputMode="numeric"
          min={100}
          step={10}
          defaultValue={filtres.budget}
          className="champ"
        />
      </div>
      <div>
        <label htmlFor="f-type" className="etiquette">
          Type
        </label>
        <select id="f-type" name="type" defaultValue={filtres.type ?? ""} className="champ">
          <option value="">Tous</option>
          {TYPES_LOGEMENT.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="etiquette">Critères</legend>
        {cases.map(([nom, libelle]) => (
          <label key={nom} className="flex min-h-9 items-center gap-2">
            <input type="checkbox" name={nom} value="1" defaultChecked={Boolean(filtres[nom])} className="size-5 accent-[var(--sapin)]" />
            {libelle}
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="f-tri" className="etiquette">
          Trier par
        </label>
        <select id="f-tri" name="tri" defaultValue={filtres.tri} className="champ">
          <option value="recent">Plus récent</option>
          <option value="prix">Prix croissant</option>
          <option value="trajet">Plus proche du campus</option>
        </select>
      </div>
      <button type="submit" className="btn-sapin">
        Appliquer
      </button>
    </form>
  );
}
