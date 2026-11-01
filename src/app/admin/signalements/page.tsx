import Link from "next/link";
import { Suspense } from "react";
import { MOTIFS_SIGNALEMENT, dateLongue } from "@/lib/annonces";
import { exigerAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { modererAnnonce, traiterSignalement } from "../actions";

export default function AdminSignalements({ searchParams }: PageProps<"/admin/signalements">) {
  return (
    <Suspense fallback={<p className="text-gris">Chargement…</p>}>
      <Contenu searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/admin/signalements">["searchParams"] }) {
  await exigerAdmin();
  const tous = (await searchParams).tous === "1";
  const supabase = await createClient();
  let requete = supabase
    .from("signalements")
    .select("id, motif, details, statut, cree_le, annonce_id, annonces(id, type_logement, quartier, statut)")
    .order("cree_le", { ascending: false })
    .limit(200);
  if (!tous) requete = requete.eq("statut", "ouvert");
  const { data } = await requete;

  type Ligne = {
    id: number;
    motif: keyof typeof MOTIFS_SIGNALEMENT;
    details: string;
    statut: string;
    cree_le: string;
    annonce_id: number;
    annonces: { id: number; type_logement: string; quartier: string; statut: string } | null;
  };
  const signalements = (data ?? []) as unknown as Ligne[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-semibold">Signalements</h1>
        <Link href={tous ? "/admin/signalements" : "/admin/signalements?tous=1"} className="text-sm font-semibold text-sapin hover:underline">
          {tous ? "Voir seulement les ouverts" : "Voir aussi les signalements traités"}
        </Link>
      </div>

      {!signalements.length && <p className="rounded-xl bg-sapin-doux p-4">Aucun signalement à traiter.</p>}

      <ul className="flex flex-col gap-4">
        {signalements.map((s) => (
          <li key={s.id} className="carte flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="badge bg-corail-doux text-corail">{MOTIFS_SIGNALEMENT[s.motif]}</span>
              <Link href={`/logements/${s.annonce_id}`} className="font-semibold hover:underline">
                Annonce #{s.annonce_id}
                {s.annonces ? ` · ${s.annonces.type_logement} · ${s.annonces.quartier} (${s.annonces.statut})` : ""}
              </Link>
              <span className="text-sm text-gris">le {dateLongue(s.cree_le)}</span>
              {s.statut !== "ouvert" && <span className="badge bg-doux text-gris">{s.statut === "traite" ? "Traité" : "Rejeté"}</span>}
            </div>
            {s.details && <p className="whitespace-pre-line rounded-xl bg-doux p-3 text-sm">{s.details}</p>}
            <div className="flex flex-wrap gap-2">
              {s.annonces?.statut === "publiee" && (
                <form action={modererAnnonce}>
                  <input type="hidden" name="id" value={s.annonce_id} />
                  <input type="hidden" name="statut" value="retiree" />
                  <input type="hidden" name="motif" value={`Retirée après signalement : ${MOTIFS_SIGNALEMENT[s.motif]}`} />
                  <button type="submit" className="btn-corail min-h-10 text-sm">
                    Retirer l&apos;annonce
                  </button>
                </form>
              )}
              {s.statut === "ouvert" ? (
                <>
                  <form action={traiterSignalement}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" name="statut" value="traite" className="btn-sapin min-h-10 text-sm">
                      Marquer traité
                    </button>
                  </form>
                  <form action={traiterSignalement}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" name="statut" value="rejete" className="btn-ligne min-h-10 text-sm">
                      Rejeter (non fondé)
                    </button>
                  </form>
                </>
              ) : (
                <form action={traiterSignalement}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" name="statut" value="ouvert" className="btn-ligne min-h-10 text-sm">
                    Rouvrir
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
