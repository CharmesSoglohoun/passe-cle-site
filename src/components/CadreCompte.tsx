// Mise en page commune aux écrans de compte : une carte centrée, un titre, une phrase d'introduction.
export function CadreCompte({ titre, intro, children }: { titre: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{titre}</h1>
        {intro && <p className="text-gris">{intro}</p>}
      </div>
      <div className="carte p-6">{children}</div>
    </div>
  );
}
