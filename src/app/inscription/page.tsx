import type { Metadata } from "next";
import Link from "next/link";
import { CadreCompte } from "@/components/CadreCompte";
import { FormulaireInscription } from "@/components/FormulairesCompte";

export const metadata: Metadata = { title: "Créer un compte" };

export default function PageInscription() {
  return (
    <CadreCompte titre="Bienvenue sur Passe-Clé" intro="Un compte gratuit pour voir le contact des bailleurs, enregistrer des logements et publier le vôtre.">
      <FormulaireInscription />
      <p className="mt-6 text-center text-sm">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-sapin hover:underline">
          Se connecter
        </Link>
      </p>
    </CadreCompte>
  );
}
