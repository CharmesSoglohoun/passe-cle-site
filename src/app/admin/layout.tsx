import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

const LIENS = [
  ["/admin", "Tableau de bord"],
  ["/admin/annonces", "Annonces"],
  ["/admin/signalements", "Signalements"],
  ["/admin/utilisateurs", "Utilisateurs"],
] as const;

// Le rôle admin est vérifié dans chaque page (exigerAdmin) et par la base (règles RLS).
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-corail">Espace administrateur</p>
      <nav aria-label="Administration" className="mb-8 mt-3 flex flex-wrap gap-2">
        {LIENS.map(([href, libelle]) => (
          <Link key={href} href={href} className="btn-ligne min-h-10 text-sm">
            {libelle}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
