import Image from "next/image";
import Link from "next/link";
import {
  euros,
  nomCampus,
  photoPrincipale,
  piecesDeLaVisite,
  titre,
  total,
  urlPhoto,
  type AnnonceAvecPhotos,
} from "@/lib/annonces";

export function CarteAnnonce({ annonce, prioritaire = false }: { annonce: AnnonceAvecPhotos; prioritaire?: boolean }) {
  const photo = photoPrincipale(annonce.photos);
  const nbPieces = piecesDeLaVisite(annonce.photos).length;

  return (
    <Link
      href={`/logements/${annonce.id}`}
      className="group flex flex-col gap-3 rounded-3xl border border-trait bg-carte p-2 shadow-(--ombre) transition-all hover:-translate-y-0.5 hover:border-sapin/40 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-doux">
        {photo && (
          <Image
            src={urlPhoto(photo.chemin)}
            alt={`${annonce.type_logement} à ${annonce.quartier} : ${photo.piece}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            priority={prioritaire}
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {nbPieces > 0 && <span className="badge bg-white text-[#10241D]">Visite · {nbPieces} pièces</span>}
          {annonce.est_exemple && <span className="badge bg-[#10241D] text-white">Exemple</span>}
          {annonce.statut === "attribuee" && <span className="badge bg-[#10241D] text-white">Attribué</span>}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <p className="flex items-baseline gap-1.5">
          <span className="font-titre text-2xl font-semibold tabular-nums">{euros(total(annonce))}</span>
          <span className="text-sm text-gris">CC / mois</span>
        </p>
        <p className="font-semibold">
          {titre(annonce)} · {annonce.quartier}
        </p>
        {annonce.trajet_minutes && (
          <p className="text-sm font-semibold text-sapin">
            {annonce.trajet_minutes} min {annonce.trajet_mode} · {nomCampus(annonce.campus)}
          </p>
        )}
      </div>
    </Link>
  );
}
