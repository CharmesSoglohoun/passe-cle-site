import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VisiteVirtuelle } from "@/components/VisiteVirtuelle";
import {
  DPE,
  STATUTS,
  dateLongue,
  euros,
  nomCampus,
  piecesDeLaVisite,
  titre,
  total,
} from "@/lib/annonces";
import { compterVue, estFavori, uneAnnonce } from "@/lib/requetes";
import { membreConnecte } from "@/lib/session";
import { BlocContact, BoutonFavori, FormulaireSignalement } from "./Interactions";

export default function PageAnnonce({ params }: PageProps<"/logements/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Suspense fallback={<div className="aspect-[16/10] animate-pulse rounded-2xl bg-doux" />}>
        <Fiche params={params} />
      </Suspense>
    </div>
  );
}

async function Fiche({ params }: { params: PageProps<"/logements/[id]">["params"] }) {
  const id = Number((await params).id);
  const [annonce, membre] = await Promise.all([uneAnnonce(id), membreConnecte()]);
  if (!annonce) notFound();

  const visible = annonce.statut === "publiee" || annonce.statut === "attribuee";
  if (visible) await compterVue(id);
  const favori = membre ? await estFavori(id) : false;
  const pieces = piecesDeLaVisite(annonce.photos);
  const libelle = titre(annonce);
  const coutEstime = total(annonce) + 30 + 25; // électricité et internet, estimations moyennes

  return (
    <article className="flex flex-col gap-8">
      <Link href="/logements" className="w-fit text-sm font-semibold text-sapin hover:underline">
        ← Retour aux résultats
      </Link>

      {annonce.est_exemple && (
        <p className="rounded-xl bg-attente-doux p-3 text-sm text-attente">
          <strong>Annonce d&apos;exemple.</strong> Elle montre à quoi ressemblera une vraie annonce : le logement et le
          bailleur sont fictifs.
        </p>
      )}
      {!visible && (
        <p className="rounded-xl bg-doux p-3 text-sm">
          <strong>{STATUTS[annonce.statut]?.libelle}.</strong> Cette annonce n&apos;est visible que par vous
          {membre?.role === "admin" ? " (administrateur)" : ""}.
          {annonce.motif_moderation ? ` Motif : ${annonce.motif_moderation}` : ""}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <VisiteVirtuelle pieces={pieces} titre={libelle} />

          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {libelle} · {annonce.quartier}
            </h1>
            <p className="text-gris">
              Disponible le {dateLongue(annonce.disponible_le)}
              {annonce.trajet_minutes
                ? ` · ${annonce.trajet_minutes} min ${annonce.trajet_mode} de ${nomCampus(annonce.campus)}`
                : ""}
            </p>
            {annonce.description && <p className="mt-2 whitespace-pre-line">{annonce.description}</p>}
          </header>

          <section className="carte p-5">
            <h2 className="mb-4 text-xl font-bold">En bref</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["Type", annonce.type_logement],
                ["Surface", `${annonce.surface} m²`],
                ["Meublé", annonce.meuble ? "Oui" : "Non"],
                ["Étage", annonce.etage || "Non précisé"],
                ["Ascenseur", annonce.ascenseur ? "Oui" : "Non"],
                ["Bailleur", annonce.bailleur_type],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-gris">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="carte p-5">
            <h2 className="mb-4 text-xl font-bold">Le coût réel</h2>
            <dl className="flex flex-col gap-2">
              <Ligne libelle="Loyer" valeur={euros(annonce.loyer)} />
              <Ligne libelle="Charges" valeur={euros(annonce.charges)} />
              <Ligne libelle="Total charges comprises" valeur={euros(total(annonce))} fort />
              <Ligne libelle="Électricité et internet (estimation)" valeur="≈ 55 €" />
              <Ligne libelle="Budget mensuel estimé" valeur={`≈ ${euros(coutEstime)}`} fort />
              <Ligne libelle="Dépôt de garantie" valeur={euros(annonce.depot)} />
            </dl>
            <p className="mt-4 text-sm text-gris">
              {annonce.apl ? "Logement éligible aux APL. " : "Éligibilité aux APL non indiquée. "}
              Estimez votre aide sur le{" "}
              <a
                href="https://www.caf.fr/"
                className="font-semibold text-sapin underline"
                target="_blank"
                rel="noreferrer"
              >
                site de la CAF (rubrique simulation logement)
              </a>
              .
            </p>
          </section>

          {annonce.equipements.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Équipements</h2>
              <ul className="flex flex-wrap gap-2">
                {annonce.equipements.map((e) => (
                  <li key={e} className="badge bg-sapin-doux px-3 py-1.5 text-sm text-encre">
                    {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {annonce.dpe && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Diagnostic énergétique (DPE)</h2>
              <ol className="flex max-w-sm flex-col gap-1" aria-label={`Classe énergie ${annonce.dpe}`}>
                {Object.entries(DPE).map(([lettre, s]) => (
                  <li
                    key={lettre}
                    className={`flex h-7 items-center rounded-r-md px-2 text-sm font-bold ${
                      lettre === annonce.dpe ? "ring-2 ring-encre ring-offset-2 ring-offset-fond" : "opacity-40"
                    }`}
                    style={{ background: s.fond, color: s.texte, width: `${s.largeur}%` }}
                  >
                    {lettre}
                    {lettre === annonce.dpe && <span className="ml-auto">Ce logement</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(annonce.ce_que_j_ai_aime || annonce.ce_qu_il_faut_savoir) && (
            <section className="carte p-5">
              <h2 className="mb-1 text-xl font-bold">
                Le mot de {annonce.sortant_prenom || "l'étudiant qui part"}
              </h2>
              {annonce.sortant_etablissement && <p className="mb-4 text-sm text-gris">{annonce.sortant_etablissement}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                {annonce.ce_que_j_ai_aime && (
                  <div>
                    <h3 className="mb-1 font-bold text-sapin">Ce que j&apos;ai aimé</h3>
                    <p className="whitespace-pre-line">{annonce.ce_que_j_ai_aime}</p>
                  </div>
                )}
                {annonce.ce_qu_il_faut_savoir && (
                  <div>
                    <h3 className="mb-1 font-bold text-corail">Ce qu&apos;il faut savoir</h3>
                    <p className="whitespace-pre-line">{annonce.ce_qu_il_faut_savoir}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="carte flex flex-col gap-4 p-5">
            <p className="flex items-baseline gap-1.5">
              <span className="font-titre text-3xl font-extrabold tabular-nums">{euros(total(annonce))}</span>
              <span className="text-gris">CC / mois</span>
            </p>
            <h2 className="text-lg font-bold">Le bailleur · {annonce.bailleur_type}</h2>
            {visible ? (
              <BlocContact annonceId={annonce.id} connecte={Boolean(membre)} exemple={annonce.est_exemple} />
            ) : (
              <p className="text-sm text-gris">Le contact s&apos;affichera une fois l&apos;annonce en ligne.</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <BoutonFavori annonceId={annonce.id} initial={favori} connecte={Boolean(membre)} />
            </div>
          </div>
          <div className="rounded-2xl bg-corail-doux p-4 text-sm">
            <strong>Ne versez jamais d&apos;argent</strong> avant d&apos;avoir visité ou signé un bail. Un bailleur qui
            demande un virement pour « réserver » est presque toujours un escroc.
          </div>
          {visible && <FormulaireSignalement annonceId={annonce.id} />}
        </aside>
      </div>
    </article>
  );
}

function Ligne({ libelle, valeur, fort = false }: { libelle: string; valeur: string; fort?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${fort ? "border-t border-trait pt-2 font-bold" : ""}`}>
      <dt>{libelle}</dt>
      <dd className="tabular-nums">{valeur}</dd>
    </div>
  );
}
