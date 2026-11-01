import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { SymbolePasseCle } from "@/components/Logo";
import { MenuCompte } from "@/components/MenuCompte";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Titres en Fraunces (serif moderne, plus chic), texte courant en Figtree
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });

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
    { media: "(prefers-color-scheme: light)", color: "#fffcf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1411" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 btn-sapin">
          Aller au contenu
        </a>
        <header className="sticky top-0 z-40 border-b border-trait/70 bg-fond/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
            <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-titre text-xl font-semibold tracking-tight text-sapin sm:text-[23px]">
              <SymbolePasseCle taille={34} />
              Passe-Clé
            </Link>
            <nav aria-label="Navigation principale" className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-3">
              <Link href="/logements" className="rounded-full px-3 py-2 hover:bg-doux">
                Chercher
              </Link>
              <Link href="/publier" className="hidden rounded-full border border-trait px-4 py-2 hover:border-sapin hover:text-sapin sm:inline-flex">
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
        <footer className="mt-20 bg-sapin-fonce text-white/75">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm sm:flex-row sm:items-center">
            {/* Sur le fond émeraude foncé, le symbole passe en blanc et pêche */}
            <p
              className="flex items-center gap-2 font-titre text-lg font-semibold text-white"
              style={{ "--sapin": "#ffffff", "--corail": "#f6a27c" } as React.CSSProperties}
            >
              <SymbolePasseCle taille={26} />
              Passe-Clé
            </p>
            <p>Le logement de ceux qui partent, pour ceux qui arrivent.</p>
            <nav aria-label="Informations légales" className="flex gap-4 sm:ml-auto">
              <Link href="/mentions-legales" className="hover:text-white hover:underline">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:text-white hover:underline">
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
