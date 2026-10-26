import Link from "next/link";
import { Suspense } from "react";
import { exigerAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

type Stats = Record<
  | "membres"
  | "membres_7j"
  | "membres_verifies"
  | "annonces_en_attente"
  | "annonces_publiees"
  | "annonces_attribuees"
  | "annonces_exemples"
  | "vues_total"
  | "contacts_30j"
  | "signalements_ouverts",
  number
>;

export default function TableauDeBord() {
  return (
    <Suspense fallback={<p className="text-gris">Chargement des chiffres…</p>}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_statistiques");
  if (error || !data) return <p className="text-corail">Statistiques indisponibles : {error?.message}</p>;
  const s = data as Stats;

  const aTraiter = [
    { n: s.annonces_en_attente, libelle: "annonce(s) à valider", href: "/admin/annonces" },
    { n: s.signalements_ouverts, libelle: "signalement(s) ouvert(s)", href: "/admin/signalements" },
  ].filter((x) => x.n > 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold">Tableau de bord</h1>

      {aTraiter.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {aTraiter.map((x) => (
            <Link key={x.href} href={x.href} className="btn-corail">
              {x.n} {x.libelle}
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-sapin-doux p-4">Rien à traiter pour le moment.</p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre libelle="Membres inscrits" valeur={s.membres} detail={`+${s.membres_7j} sur 7 jours`} />
        <Chiffre libelle="Étudiants vérifiés" valeur={s.membres_verifies} />
        <Chiffre libelle="Annonces en ligne" valeur={s.annonces_publiees} detail={`+ ${s.annonces_exemples} d'exemple`} />
        <Chiffre libelle="Logements attribués" valeur={s.annonces_attribuees} />
        <Chiffre libelle="Vues d'annonces" valeur={s.vues_total} />
        <Chiffre libelle="Contacts bailleur affichés" valeur={s.contacts_30j} detail="sur 30 jours" />
        <Chiffre libelle="En attente de validation" valeur={s.annonces_en_attente} />
        <Chiffre libelle="Signalements ouverts" valeur={s.signalements_ouverts} />
      </dl>

      <p className="text-sm text-gris">
        Fréquentation du site (visiteurs, pages vues, provenance) : onglet Analytics du projet sur Vercel.
      </p>
    </div>
  );
}

function Chiffre({ libelle, valeur, detail }: { libelle: string; valeur: number; detail?: string }) {
  return (
    <div className="carte p-4">
      <dt className="text-sm text-gris">{libelle}</dt>
      <dd className="font-titre text-3xl font-extrabold tabular-nums">{valeur.toLocaleString("fr-FR")}</dd>
      {detail && <dd className="text-sm text-gris">{detail}</dd>}
    </div>
  );
}
