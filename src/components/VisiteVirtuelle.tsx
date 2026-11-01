"use client";

import Image from "next/image";
import { useState } from "react";
import { urlPhoto } from "@/lib/annonces";

type Piece = { nom: string; description: string; photos: { id: number; chemin: string }[] };

// Visite guidée pièce par pièce : onglets des pièces, photo en grand, flèches et miniatures.
export function VisiteVirtuelle({ pieces, titre }: { pieces: Piece[]; titre: string }) {
  const [indexPiece, setIndexPiece] = useState(0);
  const [indexPhoto, setIndexPhoto] = useState(0);

  if (!pieces.length) {
    return <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-doux text-gris">Pas encore de photos</div>;
  }

  const piece = pieces[indexPiece];
  const photo = piece.photos[indexPhoto] ?? piece.photos[0];

  // Les flèches passent à la photo suivante, puis à la pièce suivante.
  function avancer(sens: 1 | -1) {
    const suivante = indexPhoto + sens;
    if (suivante >= 0 && suivante < piece.photos.length) return setIndexPhoto(suivante);
    const autrePiece = (indexPiece + sens + pieces.length) % pieces.length;
    setIndexPiece(autrePiece);
    setIndexPhoto(sens === 1 ? 0 : pieces[autrePiece].photos.length - 1);
  }

  return (
    <section aria-label="Visite virtuelle" className="flex flex-col gap-3">
      <div
        className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-doux"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") avancer(1);
          if (e.key === "ArrowLeft") avancer(-1);
        }}
      >
        <Image
          key={photo.id}
          src={urlPhoto(photo.chemin)}
          alt={`${titre} : ${piece.nom}, photo ${indexPhoto + 1} sur ${piece.photos.length}`}
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover"
          priority={indexPiece === 0 && indexPhoto === 0}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <p className="font-titre text-lg font-bold">
            {indexPiece + 1}. {piece.nom}
          </p>
          {piece.description && <p className="text-sm opacity-90">{piece.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => avancer(-1)}
          aria-label="Photo précédente"
          className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-[#10241D] shadow"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => avancer(1)}
          aria-label="Photo suivante"
          className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-[#10241D] shadow"
        >
          ›
        </button>
        <span className="badge absolute right-2 top-2 bg-white/90 text-[#10241D]">
          {indexPhoto + 1} / {piece.photos.length}
        </span>
      </div>

      <div role="tablist" aria-label="Pièces" className="flex gap-2 overflow-x-auto pb-1">
        {pieces.map((p, i) => (
          <button
            key={p.nom + i}
            type="button"
            role="tab"
            aria-selected={i === indexPiece}
            onClick={() => {
              setIndexPiece(i);
              setIndexPhoto(0);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 pr-3 text-left text-sm font-semibold ${
              i === indexPiece ? "border-sapin bg-sapin-doux" : "border-trait bg-carte hover:bg-doux"
            }`}
          >
            <span className="relative size-12 overflow-hidden rounded-lg bg-doux">
              <Image src={urlPhoto(p.photos[0].chemin)} alt="" fill sizes="48px" className="object-cover" />
            </span>
            {p.nom}
          </button>
        ))}
      </div>
    </section>
  );
}
