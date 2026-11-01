import { CONTACT_EMAIL, MISE_A_JOUR } from "@/lib/legal";

export function PageLegale({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">
      <h1 className="text-3xl font-semibold">{titre}</h1>
      <p className="text-sm text-gris">Dernière mise à jour : {MISE_A_JOUR}</p>
      {children}
    </article>
  );
}

export function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-sapin underline">
      {CONTACT_EMAIL}
    </a>
  ) : (
    <span>l&apos;adresse de contact du site (bientôt disponible)</span>
  );
}
