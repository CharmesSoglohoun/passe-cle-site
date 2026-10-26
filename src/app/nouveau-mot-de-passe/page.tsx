import type { Metadata } from "next";
import { CadreCompte } from "@/components/CadreCompte";
import { FormulaireNouveauMotDePasse } from "@/components/FormulairesCompte";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// Accessible seulement connecté (le lien de l'e-mail ouvre la session, voir le proxy).
export default function PageNouveauMotDePasse() {
  return (
    <CadreCompte titre="Nouveau mot de passe" intro="Choisissez un mot de passe que vous n'utilisez sur aucun autre site.">
      <FormulaireNouveauMotDePasse />
    </CadreCompte>
  );
}
