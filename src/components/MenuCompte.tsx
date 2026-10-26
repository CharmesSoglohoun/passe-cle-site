import Link from "next/link";
import { membreConnecte } from "@/lib/session";

// Partie de l'en-tête qui dépend de la personne connectée (lue à chaque requête).
export async function MenuCompte() {
  const membre = await membreConnecte();

  if (!membre) {
    return (
      <Link href="/connexion" className="btn-sapin min-h-10 px-4 text-sm">
        Se connecter
      </Link>
    );
  }

  return (
    <>
      {membre.role === "admin" && (
        <Link href="/admin" className="rounded-full bg-or/20 px-3 py-2 text-encre hover:bg-or/30">
          Admin
        </Link>
      )}
      <Link href="/mon-espace" className="btn-ligne min-h-10 px-4 text-sm">
        {membre.prenom || "Mon espace"}
      </Link>
    </>
  );
}
