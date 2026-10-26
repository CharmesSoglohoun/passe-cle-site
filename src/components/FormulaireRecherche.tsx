import { CAMPUS } from "@/lib/annonces";

// Formulaire GET classique : il fonctionne sans JavaScript et l'adresse obtenue se partage.
export function FormulaireRecherche({ campus = "", budget }: { campus?: string; budget?: number }) {
  return (
    <form action="/logements" className="flex flex-col gap-4">
      <div>
        <label htmlFor="campus" className="etiquette">
          Campus ou quartier
        </label>
        <select id="campus" name="campus" defaultValue={campus} className="champ">
          <option value="">Tous les campus</option>
          {CAMPUS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="budget" className="etiquette">
          Budget maximum, charges comprises
        </label>
        <div className="relative">
          <input
            id="budget"
            name="budget"
            type="number"
            inputMode="numeric"
            min={100}
            max={3000}
            step={10}
            placeholder="500"
            defaultValue={budget}
            className="champ pr-16"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gris">€ / mois</span>
        </div>
      </div>
      <button type="submit" className="btn-corail">
        Rechercher
      </button>
    </form>
  );
}
