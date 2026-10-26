import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CadreCompte } from "@/components/CadreCompte";
import { FormulaireConnexion } from "@/components/FormulairesCompte";
import { destinationSure } from "@/lib/actions-compte";

export const metadata: Metadata = { title: "Connexion" };

export default function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  return (
    <CadreCompte titre="Content de vous revoir" intro="Connectez-vous pour contacter les bailleurs, enregistrer des logements et publier le vôtre.">
      <Suspense fallback={<FormulaireConnexion suite="/mon-espace" />}>
        <Contenu searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-sapin hover:underline">
          Créer un compte
        </Link>
      </p>
    </CadreCompte>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const params = await searchParams;
  const suite = await destinationSure(params.suite);
  return (
    <div className="flex flex-col gap-4">
      {params.erreur === "lien" && (
        <p role="alert" className="rounded-xl bg-corail-doux p-3 text-sm">
          Ce lien a expiré ou a déjà servi. Connectez-vous, ou redemandez un lien.
        </p>
      )}
      {params.confirme === "1" && (
        <p className="rounded-xl bg-sapin-doux p-3 text-sm">Adresse confirmée. Vous pouvez vous connecter.</p>
      )}
      <FormulaireConnexion suite={suite} />
    </div>
  );
}
