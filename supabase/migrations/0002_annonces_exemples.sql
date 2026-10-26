-- =====================================================================
--  Passe-Clé : 6 annonces d'exemple (reprises de la démo)
-- =====================================================================
--  Elles sont marquées est_exemple = true : le site affiche un bandeau
--  « Annonce d'exemple » et les coordonnées du bailleur sont fictives.
--  Pour les retirer plus tard :  delete from public.annonces where est_exemple;
-- =====================================================================

do $$
declare
  v_id bigint;
  v_annonce record;
  v_piece int;
  v_photo int;
  -- Pièces de la visite, dans l'ordre, avec leur description par défaut
  v_pieces text[] := array['Entrée', 'Pièce principale', 'Cuisine', 'Salle de bain', 'Vue / extérieur', 'Immeuble et parties communes'];
  v_descriptions text[] := array[
    'Porte blindée, placard d''entrée avec penderie et interphone.',
    'Lumineuse, avec lit, bureau sous la fenêtre et rangements.',
    'Plaques deux feux, micro-ondes, frigo avec freezer.',
    'Douche, lavabo et WC.',
    'Vue dégagée, sans vis-à-vis direct.',
    'Hall propre, local à vélos fermé, boîtes aux lettres.'
  ];
  -- Photos disponibles dans /public/photos, par pièce (même ordre que v_pieces)
  v_photos text[][] := array[
    array['entree-1', 'entree-2', 'entree-3', 'entree-1', 'entree-2'],
    array['piece-1', 'piece-2', 'piece-3', 'piece-4', 'sejour-1'],
    array['cuisine-1', 'cuisine-2', 'cuisine-3', 'cuisine-4', 'cuisine-5'],
    array['sdb-1', 'sdb-2', 'sdb-3', 'sdb-4', 'sdb-1'],
    array['vue-1', 'vue-2', 'vue-3', 'vue-sainte-anne', 'vue-1'],
    array['immeuble-1', 'immeuble-2', 'immeuble-3', 'immeuble-4', 'immeuble-1']
  ];
begin
  for v_annonce in
    select * from (values
      (1, 'Studio', true, 22, 'Villejean', '3e', true, array['Lit','Bureau','Lave-linge','Fibre','Cuisine équipée','Ascenseur'], 'D', false, true,
       'r2', 5, 'à pied', 380, 50, 760, true, date '2027-07-01',
       'Léa', 'Université Rennes 2', 'Studio meublé au calme, idéal pour une première année à Rennes 2.',
       'Très lumineux le matin, la fac à 5 minutes et le métro juste à côté. Immeuble calme.',
       'Chauffage électrique : la facture monte un peu en hiver. La douche est petite.',
       'Particulier', 'M. Exemple', '06 00 00 00 00', 'bailleur@exemple.fr',
       'Garant demandé, ou garantie Visale acceptée. Dossier : pièce d''identité, certificat de scolarité, justificatifs du garant.'),
      (2, 'T1', false, 30, 'Beaulieu', '2e', false, array['Fibre','Cuisine équipée','Lave-linge','Animaux acceptés'], 'C', true, true,
       'r1', 8, 'à vélo', 470, 50, 470, true, date '2027-07-15',
       'Yanis', 'Université de Rennes', 'T1 non meublé avec cuisine séparée, proche du campus de Beaulieu.',
       'Grand séjour, cuisine séparée, campus de Beaulieu à vélo en 8 minutes.',
       'Pas d''ascenseur. Logement non meublé : il faut prévoir lit et bureau.',
       'Agence', 'Agence Exemple', '02 00 00 00 00', 'agence@exemple.fr',
       'Garantie Visale acceptée. Dossier complet demandé avant visite.'),
      (3, 'Colocation', true, 12, 'Centre / Sainte-Anne', '4e', true, array['Lit','Bureau','Fibre','Cuisine équipée','Lave-linge','Ascenseur'], 'E', false, true,
       'centre', 6, 'à pied', 340, 50, 340, true, date '2027-08-01',
       'Maëlle', 'Sciences Po Rennes', 'Chambre dans un T4 partagé à trois, en plein centre.',
       'Colocs sympas, en plein centre, métro ligne A à 2 minutes.',
       'Le salon est partagé, la salle de bain aussi (à trois). Rue animée le week-end.',
       'Particulier', 'Mme Exemple', '06 00 00 00 01', 'coloc@exemple.fr',
       'Garant demandé. Bail individuel.'),
      (4, 'Résidence étudiante', true, 18, 'La Harpe', '1er', true, array['Lit','Bureau','Fibre','Cuisine équipée','Ascenseur'], 'B', false, false,
       'harpe', 3, 'à pied', 405, 50, 405, true, date '2027-09-01',
       'Tom', 'Université Rennes 2', 'Chambre en résidence récente avec laverie et salle d''étude.',
       'Résidence récente, laverie et salle d''étude au rez-de-chaussée.',
       'Peu de rangements. Les visites passent par l''accueil de la résidence.',
       'Résidence', 'Résidence Exemple', '02 00 00 00 02', 'residence@exemple.fr',
       'Garantie Visale acceptée. Certificat de scolarité obligatoire.'),
      (5, 'Studio', true, 19, 'Thabor', 'RDC', false, array['Lit','Bureau','Fibre','Cuisine équipée','Animaux acceptés'], 'D', true, true,
       'centre', 8, 'à pied', 420, 50, 840, true, date '2027-07-10',
       'Inès', 'Rennes School of Business', 'Studio meublé sur cour, à deux pas du parc du Thabor.',
       'Quartier calme à côté du parc du Thabor, tout se fait à pied.',
       'Rez-de-chaussée sur cour : il fait un peu sombre l''hiver.',
       'Particulier', 'M. Exemple', '06 00 00 00 02', 'thabor@exemple.fr',
       'Garant demandé.'),
      (6, 'Chambre chez l''habitant', true, 14, 'Cesson-Sévigné', '1er', false, array['Lit','Bureau','Fibre','Lave-linge'], 'C', false, false,
       'cesson', 6, 'à pied', 320, 30, 320, false, date '2027-09-01',
       'Hugo', 'Université de Rennes', 'Chambre dans une maison avec jardin, au calme.',
       'Maison au calme avec jardin, propriétaires très arrangeants.',
       'Le dernier bus passe tôt le soir. Accès cuisine sur créneaux.',
       'Particulier', 'Mme Exemple', '06 00 00 00 03', 'habitant@exemple.fr',
       'Pas de garant demandé. Rencontre avant engagement.')
    ) as t(num, type_logement, meuble, surface, quartier, etage, ascenseur, equipements, dpe, animaux, proche_metro,
           campus, trajet_minutes, trajet_mode, loyer, charges, depot, apl, disponible_le,
           sortant_prenom, sortant_etablissement, description, aime, savoir,
           bailleur_type, b_nom, b_tel, b_email, b_conditions)
  loop
    insert into public.annonces (
      statut, est_exemple, type_logement, meuble, surface, quartier, etage, ascenseur, equipements, dpe,
      animaux, proche_metro, campus, trajet_minutes, trajet_mode, loyer, charges, depot, apl, disponible_le,
      sortant_prenom, sortant_etablissement, description, ce_que_j_ai_aime, ce_qu_il_faut_savoir,
      bailleur_type, accord_bailleur, publiee_le
    ) values (
      'publiee', true, v_annonce.type_logement, v_annonce.meuble, v_annonce.surface, v_annonce.quartier,
      v_annonce.etage, v_annonce.ascenseur, v_annonce.equipements, v_annonce.dpe, v_annonce.animaux,
      v_annonce.proche_metro, v_annonce.campus, v_annonce.trajet_minutes, v_annonce.trajet_mode,
      v_annonce.loyer, v_annonce.charges, v_annonce.depot, v_annonce.apl, v_annonce.disponible_le,
      v_annonce.sortant_prenom, v_annonce.sortant_etablissement, v_annonce.description, v_annonce.aime,
      v_annonce.savoir, v_annonce.bailleur_type, true, now() - (v_annonce.num || ' hours')::interval
    ) returning id into v_id;

    insert into public.contacts_bailleur (annonce_id, nom, telephone, email, conditions)
    values (v_id, v_annonce.b_nom, v_annonce.b_tel, v_annonce.b_email, v_annonce.b_conditions);

    -- 2 photos par pièce, choisies en décalant selon l'annonce pour varier les visuels
    for v_piece in 1..6 loop
      for v_photo in 0..1 loop
        insert into public.photos (annonce_id, piece, ordre_piece, ordre, chemin, description_piece)
        values (
          v_id, v_pieces[v_piece], v_piece, v_photo,
          '/photos/' || v_photos[v_piece][((v_annonce.num + v_photo - 1) % 5) + 1] || '.jpg',
          v_descriptions[v_piece]
        );
      end loop;
    end loop;
  end loop;
end;
$$;
