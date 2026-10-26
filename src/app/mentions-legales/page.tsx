import type { Metadata } from "next";
import { Contact, PageLegale } from "@/components/PageLegale";
import { EDITEUR, VILLE_EDITEUR } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales et conditions d'utilisation" };

export default function MentionsLegales() {
  return (
    <PageLegale titre="Mentions légales et conditions d'utilisation">
      <h2>Éditeur</h2>
      <p>
        Passe-Clé est un projet personnel édité par {EDITEUR}, {VILLE_EDITEUR}. Contact : <Contact />.
      </p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Base de données et
        photos hébergées par Supabase Inc. (serveurs situés dans l&apos;Union européenne).
      </p>

      <h2>Le service</h2>
      <p>
        Passe-Clé met en relation des étudiants qui libèrent un logement à Rennes avec des étudiants qui en cherchent un.
        Passe-Clé n&apos;est ni une agence immobilière, ni un bailleur : le site ne perçoit aucun loyer, aucun frais
        de dossier et n&apos;intervient pas dans la signature du bail. Le service est gratuit.
      </p>

      <h2>Règles pour publier</h2>
      <ul>
        <li>Publier uniquement un logement que vous occupez réellement ou dont vous êtes le bailleur.</li>
        <li>Avoir informé le bailleur et obtenu son accord pour qu&apos;il soit contacté via Passe-Clé.</li>
        <li>Donner des informations et des photos exactes, prises dans le logement.</li>
        <li>Ne jamais demander d&apos;argent avant une visite ou la signature d&apos;un bail.</li>
      </ul>
      <p>
        Chaque annonce est relue avant sa mise en ligne. L&apos;équipe peut refuser, retirer une annonce ou suspendre un
        compte qui ne respecte pas ces règles, notamment en cas de suspicion d&apos;arnaque.
      </p>

      <h2>Règles pour contacter un bailleur</h2>
      <p>
        Les coordonnées des bailleurs servent uniquement à proposer sa candidature pour le logement concerné. Toute
        autre utilisation (démarchage, revente, collecte en masse) est interdite et entraîne la suspension du compte.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Les annonces sont rédigées par les membres, qui en sont responsables. Passe-Clé ne garantit pas
        l&apos;exactitude des annonces et ne peut être tenu responsable des relations entre étudiants et bailleurs.
        Une annonce suspecte se signale depuis sa fiche, sans avoir besoin de compte.
      </p>

      <h2>Photos d&apos;illustration</h2>
      <p>Les photos des annonces d&apos;exemple proviennent d&apos;Unsplash (licence Unsplash).</p>
    </PageLegale>
  );
}
