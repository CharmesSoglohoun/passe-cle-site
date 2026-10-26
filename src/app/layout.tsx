import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { MenuCompte } from "@/components/MenuCompte";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Passe-Clé · Logement étudiant à Rennes", template: "%s · Passe-Clé" },
  description:
    "Le logement de ceux qui partent, pour ceux qui arrivent. Visite virtuelle pièce par pièce, coût réel et contact du bailleur, à Rennes.",
  applicationName: "Passe-Clé",
  // Site en construction : pas d'indexation par les moteurs de recherche avant le lancement.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1513" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${figtree.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 btn-sapin">
          Aller au contenu
        </a>
        <header className="sticky top-0 z-40 border-b border-trait bg-fond/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
            <Link href="/" className="font-titre text-[22px] font-extrabold tracking-tight text-sapin">
              Passe-Clé
            </Link>
            <nav aria-label="Navigation principale" className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-3">
              <Link href="/logements" className="rounded-full px-3 py-2 hover:bg-doux">
                Chercher
              </Link>
              <Link href="/publier" className="hidden rounded-full px-3 py-2 hover:bg-doux sm:inline-flex">
                Publier
              </Link>
              <Suspense fallback={<span className="inline-block h-10 w-28" aria-hidden />}>
                <MenuCompte />
              </Suspense>
            </nav>
          </div>
        </header>
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <footer className="mt-16 border-t border-trait bg-doux">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-gris sm:flex-row sm:items-center">
            <p className="font-titre font-bold text-encre">Passe-Clé</p>
            <p>Le logement de ceux qui partent, pour ceux qui arrivent.</p>
            <nav aria-label="Informations légales" className="flex gap-4 sm:ml-auto">
              <Link href="/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:underline">
                Confidentialité
              </Link>
            </nav>
          </div>
        </footer>
        {/* Mesure d'audience sans cookie (activée dans l'onglet Analytics du projet Vercel) */}
        <Analytics />
      </body>
    </html>
  );
}
