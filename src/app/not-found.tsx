import Link from "next/link";

export default function PageIntrouvable() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-20">
      <h1 className="text-3xl font-semibold">Cette page n&apos;existe pas</h1>
      <p className="text-gris">L&apos;annonce a peut-être été retirée, ou le lien est incomplet.</p>
      <Link href="/logements" className="btn-sapin">
        Voir les logements
      </Link>
    </div>
  );
}
