// Symbole Passe-Clé (piste 1 de Claude Design) : l'anneau de la clé forme une boucle de relais,
// la flèche corail montre la clé qui passe d'un étudiant au suivant.
// Les couleurs suivent le thème (clair ou sombre) grâce aux variables CSS.
export function SymbolePasseCle({ taille = 32, className = "" }: { taille?: number; className?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" aria-hidden className={className}>
      <g fill="none" stroke="var(--sapin)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 32A12 12 0 1 1 28 21.6" />
        <path d="M34 32H56M50 32V41M56 32V39" />
      </g>
      <path d="M34 25.1L24.1 26.3L30.1 15.9Z" fill="var(--corail)" />
    </svg>
  );
}
