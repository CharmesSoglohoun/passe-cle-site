-- =====================================================================
--  Passe-Clé : schéma de la base (à coller dans Supabase > SQL Editor)
-- =====================================================================
--  Principe de sécurité : le navigateur parle directement à la base avec
--  une clé publique. Ce sont donc les règles RLS ci-dessous, et elles seules,
--  qui décident qui peut lire et modifier quoi.
--
--  Rôles :
--    - visiteur (anon)        : lit les annonces publiées, peut signaler
--    - membre (authenticated) : publie (en attente de validation), favoris
--    - admin                  : modère tout (profils.role = 'admin')
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Profils (un par compte)
-- ---------------------------------------------------------------------
create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '' check (char_length(prenom) <= 60),
  etablissement text not null default '' check (char_length(etablissement) <= 120),
  role text not null default 'membre' check (role in ('membre', 'admin')),
  etudiant_verifie boolean not null default false,
  suspendu boolean not null default false,
  cree_le timestamptz not null default now()
);

alter table public.profils enable row level security;

-- Vrai si la personne connectée est un administrateur actif.
-- « security definer » : la fonction lit profils sans passer par les règles RLS
-- (sinon la règle de profils s'appellerait elle-même en boucle).
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profils
    where id = (select auth.uid()) and role = 'admin' and not suspendu
  );
$$;

-- Vrai si la personne connectée a un compte actif (non suspendu).
create or replace function public.est_membre_actif()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profils
    where id = (select auth.uid()) and not suspendu
  );
$$;

create policy "profil : lire le sien, ou tous si admin"
  on public.profils for select
  using (id = (select auth.uid()) or public.est_admin());

create policy "profil : modifier le sien"
  on public.profils for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Un membre ne peut changer que son prénom et son établissement :
-- role, etudiant_verifie et suspendu ne se modifient que par les fonctions admin.
revoke insert, update, delete on public.profils from anon, authenticated;
grant update (prenom, etablissement) on public.profils to authenticated;

-- Création automatique du profil à l'inscription (prénom transmis par le formulaire).
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 60));
  return new;
end;
$$;

create trigger a_l_inscription
  after insert on auth.users
  for each row execute function public.creer_profil();


-- ---------------------------------------------------------------------
--  2. Annonces
-- ---------------------------------------------------------------------
create table public.annonces (
  id bigint generated always as identity primary key,
  auteur_id uuid default auth.uid() references public.profils (id) on delete cascade,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'publiee', 'refusee', 'retiree', 'attribuee')),
  motif_moderation text check (char_length(motif_moderation) <= 500),
  est_exemple boolean not null default false,

  -- Le logement
  type_logement text not null check (type_logement in
    ('Studio', 'T1', 'T2', 'Colocation', 'Chambre chez l''habitant', 'Résidence étudiante')),
  meuble boolean not null default false,
  surface int not null check (surface between 5 and 200),
  quartier text not null check (char_length(quartier) between 2 and 80),
  etage text not null default '' check (char_length(etage) <= 20),
  ascenseur boolean not null default false,
  equipements text[] not null default '{}',
  dpe text check (dpe in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  animaux boolean not null default false,
  proche_metro boolean not null default false,

  -- Trajet vers le campus le plus proche
  campus text not null check (campus in ('r2', 'r1', 'centre', 'kerlann', 'harpe', 'stjacques', 'cesson')),
  trajet_minutes int check (trajet_minutes between 1 and 120),
  trajet_mode text not null default '' check (char_length(trajet_mode) <= 40),

  -- Le coût (en euros par mois)
  loyer int not null check (loyer between 50 and 3000),
  charges int not null default 0 check (charges between 0 and 1000),
  depot int not null default 0 check (depot between 0 and 6000),
  apl boolean not null default false,
  disponible_le date not null,

  -- L'étudiant qui part
  sortant_prenom text not null default '' check (char_length(sortant_prenom) <= 60),
  sortant_etablissement text not null default '' check (char_length(sortant_etablissement) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  ce_que_j_ai_aime text not null default '' check (char_length(ce_que_j_ai_aime) <= 1000),
  ce_qu_il_faut_savoir text not null default '' check (char_length(ce_qu_il_faut_savoir) <= 1000),

  -- Le bailleur (type seulement : ses coordonnées sont dans une table protégée à part)
  bailleur_type text not null check (bailleur_type in ('Particulier', 'Agence', 'Résidence')),
  accord_bailleur boolean not null check (accord_bailleur),

  vues int not null default 0,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  publiee_le timestamptz
);

create index annonces_statut_idx on public.annonces (statut, publiee_le desc);
create index annonces_auteur_idx on public.annonces (auteur_id);

alter table public.annonces enable row level security;

create policy "annonce : lire les publiées, les siennes, ou tout si admin"
  on public.annonces for select
  using (
    statut in ('publiee', 'attribuee')
    or auteur_id = (select auth.uid())
    or public.est_admin()
  );

create policy "annonce : publier (en attente de validation)"
  on public.annonces for insert to authenticated
  with check (
    auteur_id = (select auth.uid())
    and statut = 'en_attente'
    and not est_exemple
    and public.est_membre_actif()
  );

create policy "annonce : modifier la sienne"
  on public.annonces for update to authenticated
  using (auteur_id = (select auth.uid()) and public.est_membre_actif())
  with check (auteur_id = (select auth.uid()));

create policy "annonce : modérer (admin)"
  on public.annonces for update to authenticated
  using (public.est_admin())
  with check (true);

create policy "annonce : supprimer la sienne, ou toute si admin"
  on public.annonces for delete to authenticated
  using (auteur_id = (select auth.uid()) or public.est_admin());

-- Garde-fou sur les modifications faites depuis le site :
--  - l'auteur ne peut pas toucher aux champs de modération ni s'auto-publier ;
--  - s'il modifie le contenu, l'annonce repasse en attente de validation.
-- Les fonctions internes (security definer) et le SQL Editor ne sont pas concernés.
create or replace function public.controler_maj_annonce()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.maj_le := now();

  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.est_admin() then
    if new.statut = 'publiee' and old.statut is distinct from 'publiee' and new.publiee_le is null then
      new.publiee_le := now();
    end if;
    return new;
  end if;

  new.auteur_id := old.auteur_id;
  new.est_exemple := old.est_exemple;
  new.vues := old.vues;
  new.cree_le := old.cree_le;
  new.publiee_le := old.publiee_le;
  new.motif_moderation := old.motif_moderation;

  if new.statut is distinct from old.statut then
    -- Seuls changements permis à l'auteur : retirer son annonce,
    -- ou la marquer « attribuée » (et revenir en arrière).
    if not (
      new.statut = 'retiree'
      or (old.statut = 'publiee' and new.statut = 'attribuee')
      or (old.statut = 'attribuee' and new.statut = 'publiee')
    ) then
      raise exception 'Changement de statut non autorisé';
    end if;
    return new;
  end if;

  -- Contenu modifié : retour en modération.
  if (to_jsonb(new) - 'maj_le') is distinct from (to_jsonb(old) - 'maj_le') then
    new.statut := 'en_attente';
  end if;
  return new;
end;
$$;

create trigger avant_maj_annonce
  before update on public.annonces
  for each row execute function public.controler_maj_annonce();


-- ---------------------------------------------------------------------
--  3. Coordonnées du bailleur (jamais lisibles directement par le public)
-- ---------------------------------------------------------------------
create table public.contacts_bailleur (
  annonce_id bigint primary key references public.annonces (id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 120),
  telephone text not null default '' check (char_length(telephone) <= 30),
  email text not null default '' check (char_length(email) <= 160),
  conditions text not null default '' check (char_length(conditions) <= 1000)
);

alter table public.contacts_bailleur enable row level security;

create policy "contact : l'auteur de l'annonce ou un admin"
  on public.contacts_bailleur for select to authenticated
  using (
    public.est_admin()
    or exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid()))
  );

create policy "contact : l'auteur l'ajoute"
  on public.contacts_bailleur for insert to authenticated
  with check (exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid())));

create policy "contact : l'auteur le modifie"
  on public.contacts_bailleur for update to authenticated
  using (exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid())));

-- Journal des consultations : sert aux statistiques et à repérer les abus.
create table public.consultations_contact (
  id bigint generated always as identity primary key,
  annonce_id bigint not null references public.annonces (id) on delete cascade,
  membre_id uuid not null references public.profils (id) on delete cascade,
  le timestamptz not null default now()
);

create index consultations_membre_idx on public.consultations_contact (membre_id, le desc);

alter table public.consultations_contact enable row level security;

create policy "consultations : admin seulement"
  on public.consultations_contact for select to authenticated
  using (public.est_admin());

-- Seul chemin pour qu'un membre voie le contact du bailleur d'une annonce publiée.
-- Limite : 30 consultations par jour et par compte (contre l'aspiration des contacts).
create or replace function public.voir_contact_bailleur(p_annonce bigint)
returns table (nom text, telephone text, email text, conditions text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membre uuid := auth.uid();
begin
  if v_membre is null then
    raise exception 'connexion_requise';
  end if;
  if not public.est_membre_actif() then
    raise exception 'compte_suspendu';
  end if;
  if not exists (select 1 from public.annonces where id = p_annonce and statut = 'publiee') then
    raise exception 'annonce_indisponible';
  end if;

  if not exists (
    select 1 from public.consultations_contact
    where membre_id = v_membre and annonce_id = p_annonce and le > now() - interval '1 day'
  ) then
    if (select count(*) from public.consultations_contact
        where membre_id = v_membre and le > now() - interval '1 day') >= 30 then
      raise exception 'limite_atteinte';
    end if;
    insert into public.consultations_contact (annonce_id, membre_id) values (p_annonce, v_membre);
  end if;

  return query
    select c.nom, c.telephone, c.email, c.conditions
    from public.contacts_bailleur c
    where c.annonce_id = p_annonce;
end;
$$;

revoke execute on function public.voir_contact_bailleur(bigint) from anon, public;
grant execute on function public.voir_contact_bailleur(bigint) to authenticated;


-- ---------------------------------------------------------------------
--  4. Photos de la visite virtuelle (une ligne par photo, rangée par pièce)
-- ---------------------------------------------------------------------
create table public.photos (
  id bigint generated always as identity primary key,
  annonce_id bigint not null references public.annonces (id) on delete cascade,
  piece text not null check (char_length(piece) between 2 and 60),
  ordre_piece int not null default 0,
  ordre int not null default 0,
  -- Chemin dans le stockage Supabase, ou chemin « /photos/... » pour les annonces d'exemple
  chemin text not null check (char_length(chemin) <= 300),
  description_piece text not null default '' check (char_length(description_piece) <= 300)
);

create index photos_annonce_idx on public.photos (annonce_id, ordre_piece, ordre);

alter table public.photos enable row level security;

-- Visible dès que l'annonce l'est (la règle des annonces s'applique dans la sous-requête).
create policy "photos : lisibles avec leur annonce"
  on public.photos for select
  using (exists (select 1 from public.annonces a where a.id = annonce_id));

create policy "photos : l'auteur en ajoute tant que l'annonce est en attente"
  on public.photos for insert to authenticated
  with check (exists (
    select 1 from public.annonces a
    where a.id = annonce_id and a.auteur_id = (select auth.uid()) and a.statut = 'en_attente'
  ));

create policy "photos : l'auteur ou un admin les supprime"
  on public.photos for delete to authenticated
  using (
    public.est_admin()
    or exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid()))
  );

-- Espace de stockage des photos : lecture publique, envoi dans son propre dossier uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-annonces', 'photos-annonces', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "stockage : envoyer dans son dossier"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos-annonces'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.est_membre_actif()
  );

create policy "stockage : supprimer ses fichiers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos-annonces'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.est_admin())
  );

create policy "stockage : lister ses fichiers"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photos-annonces'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.est_admin())
  );


-- ---------------------------------------------------------------------
--  5. Signalements (ouverts à tous, même sans compte)
-- ---------------------------------------------------------------------
create table public.signalements (
  id bigint generated always as identity primary key,
  annonce_id bigint not null references public.annonces (id) on delete cascade,
  auteur_id uuid default auth.uid() references public.profils (id) on delete set null,
  motif text not null check (motif in ('arnaque', 'annonce_fausse', 'deja_loue', 'contenu_inapproprie', 'autre')),
  details text not null default '' check (char_length(details) <= 1000),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'traite', 'rejete')),
  cree_le timestamptz not null default now()
);

alter table public.signalements enable row level security;

create policy "signalement : tout le monde peut signaler"
  on public.signalements for insert to anon, authenticated
  with check (statut = 'ouvert' and auteur_id is not distinct from (select auth.uid()));

create policy "signalement : admin lit"
  on public.signalements for select to authenticated
  using (public.est_admin());

create policy "signalement : admin traite"
  on public.signalements for update to authenticated
  using (public.est_admin())
  with check (true);


-- ---------------------------------------------------------------------
--  6. Favoris
-- ---------------------------------------------------------------------
create table public.favoris (
  membre_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  annonce_id bigint not null references public.annonces (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (membre_id, annonce_id)
);

alter table public.favoris enable row level security;

create policy "favoris : les siens"
  on public.favoris for all to authenticated
  using (membre_id = (select auth.uid()))
  with check (membre_id = (select auth.uid()));


-- ---------------------------------------------------------------------
--  7. Fonctions utiles au site
-- ---------------------------------------------------------------------

-- Compte une vue d'annonce (appelée à l'ouverture d'une fiche).
create or replace function public.compter_vue(p_annonce bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.annonces set vues = vues + 1
  where id = p_annonce and statut in ('publiee', 'attribuee');
$$;

grant execute on function public.compter_vue(bigint) to anon, authenticated;

-- Suppression de son propre compte (RGPD). Tout ce qui en dépend part avec lui.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'connexion_requise';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.supprimer_mon_compte() from anon, public;
grant execute on function public.supprimer_mon_compte() to authenticated;


-- ---------------------------------------------------------------------
--  8. Fonctions de l'espace administrateur
-- ---------------------------------------------------------------------

create or replace function public.admin_statistiques()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'reserve_admin';
  end if;
  return jsonb_build_object(
    'membres', (select count(*) from public.profils),
    'membres_7j', (select count(*) from public.profils where cree_le > now() - interval '7 days'),
    'membres_verifies', (select count(*) from public.profils where etudiant_verifie),
    'annonces_en_attente', (select count(*) from public.annonces where statut = 'en_attente'),
    'annonces_publiees', (select count(*) from public.annonces where statut = 'publiee' and not est_exemple),
    'annonces_attribuees', (select count(*) from public.annonces where statut = 'attribuee'),
    'annonces_exemples', (select count(*) from public.annonces where est_exemple),
    'vues_total', (select coalesce(sum(vues), 0) from public.annonces),
    'contacts_30j', (select count(*) from public.consultations_contact where le > now() - interval '30 days'),
    'signalements_ouverts', (select count(*) from public.signalements where statut = 'ouvert')
  );
end;
$$;

-- Liste des comptes avec leur e-mail (qui vit dans auth.users, inaccessible autrement).
create or replace function public.admin_utilisateurs()
returns table (
  id uuid, email text, prenom text, etablissement text, role text,
  etudiant_verifie boolean, suspendu boolean, cree_le timestamptz,
  derniere_connexion timestamptz, nb_annonces bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'reserve_admin';
  end if;
  return query
    select p.id, u.email::text, p.prenom, p.etablissement, p.role,
           p.etudiant_verifie, p.suspendu, p.cree_le, u.last_sign_in_at,
           (select count(*) from public.annonces a where a.auteur_id = p.id)
    from public.profils p
    join auth.users u on u.id = p.id
    order by p.cree_le desc;
end;
$$;

create or replace function public.admin_maj_utilisateur(p_id uuid, p_verifie boolean, p_suspendu boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'reserve_admin';
  end if;
  if p_id = auth.uid() and p_suspendu then
    raise exception 'impossible_de_se_suspendre';
  end if;
  update public.profils set etudiant_verifie = p_verifie, suspendu = p_suspendu where id = p_id;
end;
$$;

revoke execute on function public.admin_statistiques() from anon, public;
revoke execute on function public.admin_utilisateurs() from anon, public;
revoke execute on function public.admin_maj_utilisateur(uuid, boolean, boolean) from anon, public;
grant execute on function public.admin_statistiques() to authenticated;
grant execute on function public.admin_utilisateurs() to authenticated;
grant execute on function public.admin_maj_utilisateur(uuid, boolean, boolean) to authenticated;
