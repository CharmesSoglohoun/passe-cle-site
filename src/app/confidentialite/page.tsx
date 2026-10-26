import type { Metadata } from "next";
import { Contact, PageLegale } from "@/components/PageLegale";
import { EDITEUR } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Confidentialite() {
  return (
    <PageLegale titre="Politique de confidentialité">
      <p>
        Cette page explique quelles données Passe-Clé collecte, pourquoi, et comment exercer vos droits (Règlement
        général sur la protection des données, RGPD). Responsable du traitement : {EDITEUR}.
      </p>

      <h2>Les données collectées</h2>
      <ul>
        <li>
          <strong>Votre compte</strong> : adresse e-mail, mot de passe (enregistré sous forme chiffrée, jamais lisible),
          prénom, établissement si vous l&apos;indiquez.
        </li>
        <li>
          <strong>Vos annonces</strong> : description du logement, photos (réduites et débarrassées de leurs
          métadonnées, dont la position GPS, avant l&apos;envoi), prix, et les coordonnées du bailleur que vous
          fournissez avec son accord.
        </li>
        <li>
          <strong>Votre activité</strong> : logements enregistrés, signalements, et la liste des annonces dont vous avez
          affiché le contact du bailleur (pour lutter contre l&apos;aspiration des coordonnées).
        </li>
        <li>
          <strong>Mesure d&apos;audience</strong> : statistiques de visite anonymes, sans cookie publicitaire.
        </li>
      </ul>

      <h2>Pourquoi</h2>
      <p>
        Uniquement pour faire fonctionner le service : vous connecter, publier et modérer les annonces, protéger les
        bailleurs et les étudiants des arnaques. Aucune donnée n&apos;est vendue ni utilisée pour de la publicité.
      </p>

      <h2>Qui y a accès</h2>
      <p>
        L&apos;administrateur du site, pour la modération. Les coordonnées d&apos;un bailleur ne sont visibles que par
        les membres connectés, une annonce à la fois. Nos sous-traitants techniques : Supabase (base de données,
        serveurs dans l&apos;Union européenne) et Vercel (hébergement du site).
      </p>

      <h2>Combien de temps</h2>
      <p>
        Tant que votre compte existe. Quand vous supprimez votre compte depuis « Mon espace », vos données, annonces
        et photos sont effacées immédiatement et définitivement.
      </p>

      <h2>Cookies</h2>
      <p>
        Un seul type de cookie, indispensable : celui qui garde votre session ouverte quand vous êtes connecté. Pas de
        cookie publicitaire, donc pas de bandeau à accepter.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez consulter, corriger et supprimer vos données à tout moment depuis « Mon espace », ou écrire à{" "}
        <Contact />. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).
      </p>
    </PageLegale>
  );
}
