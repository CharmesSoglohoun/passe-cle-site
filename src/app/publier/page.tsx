import type { Metadata } from "next";
import { Suspense } from "react";
import { exigerMembre } from "@/lib/session";
import { FormulairePublication } from "./FormulairePublication";

export const metadata: Metadata = { title: "Publier mon logement" };

export default function PagePublier() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">Je libère mon logement</h1>
        <p className="mt-2 text-gris">Cinq étapes, une dizaine de minutes, depuis votre téléphone.</p>
      </div>
      <Suspense fallback={<p className="text-gris">Chargement…</p>}>
        <Contenu />
      </Suspense>
    </div>
  );
}

async function Contenu() {
  const membre = await exigerMembre("/publier");
  if (membre.suspendu) {
    return <p className="rounded-xl bg-corail-doux p-4">Votre compte est suspendu : vous ne pouvez pas publier d&apos;annonce.</p>;
  }
  return <FormulairePublication membreId={membre.id} prenom={membre.prenom} etablissement={membre.etablissement} />;
}
