import type { Metadata } from "next";
import { CadreCompte } from "@/components/CadreCompte";
import { FormulaireOubli } from "@/components/FormulairesCompte";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function PageOubli() {
  return (
    <CadreCompte titre="Mot de passe oublié" intro="Indiquez votre adresse : vous recevrez un lien pour en choisir un nouveau.">
      <FormulaireOubli />
    </CadreCompte>
  );
}
