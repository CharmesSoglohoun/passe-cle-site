import { Suspense } from "react";
import { dateLongue } from "@/lib/annonces";
import { exigerAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { majUtilisateur } from "../actions";

type Utilisateur = {
  id: string;
  email: string;
  prenom: string;
  etablissement: string;
  role: string;
  etudiant_verifie: boolean;
  suspendu: boolean;
  cree_le: string;
  derniere_connexion: string | null;
  nb_annonces: number;
};

export default function AdminUtilisateurs() {
  return (
    <Suspense fallback={<p className="text-gris">Chargement…</p>}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const moi = await exigerAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_utilisateurs");
  if (error) return <p className="text-corail">Liste indisponible : {error.message}</p>;
  const utilisateurs = (data ?? []) as Utilisateur[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Utilisateurs ({utilisateurs.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-trait">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-doux text-gris">
            <tr>
              <th className="p-3 font-semibold">Membre</th>
              <th className="p-3 font-semibold">Inscrit le</th>
              <th className="p-3 font-semibold">Dernière connexion</th>
              <th className="p-3 font-semibold">Annonces</th>
              <th className="p-3 font-semibold">Statut</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-t border-trait align-top">
                <td className="p-3">
                  <p className="font-semibold">
                    {u.prenom || "Sans prénom"} {u.role === "admin" && <span className="badge bg-or/25 text-encre">Admin</span>}
                  </p>
                  <p className="text-gris">{u.email}</p>
                  {u.etablissement && <p className="text-gris">{u.etablissement}</p>}
                </td>
                <td className="p-3">{dateLongue(u.cree_le)}</td>
                <td className="p-3">{u.derniere_connexion ? dateLongue(u.derniere_connexion) : "Jamais"}</td>
                <td className="p-3 tabular-nums">{u.nb_annonces}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    {u.etudiant_verifie && <span className="badge w-fit bg-sapin-doux text-sapin">Vérifié</span>}
                    {u.suspendu && <span className="badge w-fit bg-corail-doux text-corail">Suspendu</span>}
                    {!u.etudiant_verifie && !u.suspendu && <span className="text-gris">Membre</span>}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={majUtilisateur}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="etudiant_verifie" value={u.etudiant_verifie ? "0" : "1"} />
                      <input type="hidden" name="suspendu" value={u.suspendu ? "1" : "0"} />
                      <button type="submit" className="btn-ligne min-h-9 px-3 text-xs">
                        {u.etudiant_verifie ? "Retirer la vérification" : "Marquer vérifié"}
                      </button>
                    </form>
                    {u.id !== moi.id && (
                      <form action={majUtilisateur}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="etudiant_verifie" value={u.etudiant_verifie ? "1" : "0"} />
                        <input type="hidden" name="suspendu" value={u.suspendu ? "0" : "1"} />
                        <button
                          type="submit"
                          className={`btn min-h-9 px-3 text-xs ${u.suspendu ? "border border-trait" : "text-corail hover:bg-corail-doux"}`}
                        >
                          {u.suspendu ? "Réactiver" : "Suspendre"}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gris">
        Un compte suspendu ne peut plus publier ni voir les contacts des bailleurs. Ses annonces restent à retirer à
        part si besoin.
      </p>
    </div>
  );
}
