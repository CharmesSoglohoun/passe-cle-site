# Mettre Passe-Clé en ligne (guide pas à pas)

Compte environ 45 minutes la première fois. Les étapes marquées **(toi)** se font dans ton navigateur, sur tes comptes. Ensuite, dis-moi « c'est fait » et je teste tout.

## Étape 1 : créer la base Supabase (toi, 10 min)

1. Va sur https://supabase.com/dashboard, puis clique sur **New project**.
2. Remplis le formulaire :
   - Name : `passe-cle`
   - Database password : clique sur **Generate**, puis range-le dans ton gestionnaire de mots de passe. Tu n'en auras presque jamais besoin, mais il ne se récupère pas.
   - Region : **West EU (Paris)**. Les données restent ainsi en France, comme l'annonce la politique de confidentialité.
3. Attends 2 minutes que le projet soit prêt.

> L'offre gratuite de Supabase permet 2 projets actifs : Charmes et Passe-Clé tiennent dedans. Un projet gratuit se met en pause après 7 jours sans aucune visite ; il suffit de le relancer depuis le tableau de bord.

## Étape 2 : créer les tables (toi, 5 min)

1. Dans le projet, menu de gauche, ouvre **SQL Editor**, puis **New query**.
2. Ouvre le fichier `supabase/migrations/0001_schema.sql`, copie tout, colle-le et clique sur **Run**. Le résultat attendu est « Success. No rows returned ».
3. Fais une nouvelle requête avec `supabase/migrations/0002_annonces_exemples.sql` (les 6 annonces d'exemple). Clique sur **Run**.

## Étape 3 : régler la connexion (toi, 5 min)

Dans **Authentication** :

1. **Sign In / Providers**, section Email : vérifie que **Enable Email provider** et **Confirm email** sont activés. Mets **Minimum password length** à `10`.
2. **URL Configuration** :
   - Site URL : `http://localhost:3000` pour l'instant. Tu la remplaceras par l'adresse Vercel à l'étape 7.
   - Redirect URLs : ajoute `http://localhost:3000/**`.

## Étape 4 : brancher les clés (toi, 2 min)

1. Dans **Project Settings**, puis **API Keys**, copie la clé **Publishable key** (elle commence par `sb_publishable_`).
2. Dans **Project Settings**, puis **Data API**, copie l'**URL** du projet (`https://xxxx.supabase.co`, sans rien après).
3. Ouvre le fichier `.env` à la racine du workspace Jarvis. Remplis les deux lignes déjà préparées :
   ```
   PASSECLE_SUPABASE_URL=https://xxxx.supabase.co
   PASSECLE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Ne copie **jamais** la clé `secret` ni `service_role` : le site n'en a pas besoin.

## Étape 5 : tester en local et devenir administrateur (on le fait ensemble)

1. Je lance le site sur http://localhost:3000.
2. Tu crées ton compte sur `/inscription`, avec l'adresse que tu veux utiliser comme administrateur, puis tu cliques sur le lien reçu par e-mail.
3. Dans le **SQL Editor**, exécute cette requête en remplaçant l'adresse :
   ```sql
   update public.profils set role = 'admin'
   where id = (select id from auth.users where email = 'ton.adresse@exemple.fr');
   ```
4. Recharge le site : un bouton **Admin** apparaît dans l'en-tête.

## Étape 6 : GitHub (toi, puis moi)

1. **(toi)** Sur https://github.com/new, crée un dépôt nommé `passe-cle-site`, **Public**, sans README.
2. **(moi)** J'y envoie le code, avec ton accord.

## Étape 7 : Vercel (toi, 10 min)

1. Sur https://vercel.com/new, importe le dépôt `passe-cle-site`.
2. Avant de cliquer sur Deploy, ouvre **Environment Variables** et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = l'URL du projet Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = la clé publishable

   Ici, les noms commencent par `NEXT_PUBLIC_`, sans `PASSECLE_`.
3. Clique sur **Deploy**, puis note l'adresse obtenue (par exemple `passe-cle-site.vercel.app`).
4. Dans l'onglet **Analytics** du projet Vercel, clique sur **Enable** : c'est ce qui compte les visiteurs, sans cookie.
5. Retourne dans Supabase, **Authentication**, puis **URL Configuration** :
   - Site URL : `https://passe-cle-site.vercel.app`
   - Redirect URLs : ajoute `https://passe-cle-site.vercel.app/**` (garde aussi celle de localhost).

La démo actuelle (https://passe-cle.vercel.app) reste en ligne, inchangée, pour les tests auprès des étudiants.

## Avant d'ouvrir au public (plus tard)

- **E-mails** : sans service d'envoi personnel, Supabase n'envoie qu'environ 2 e-mails par heure, en anglais. Il faudra brancher Resend avec un nom de domaine. Le changement se fait dans Authentication, puis SMTP Settings.
- **Adresse de contact** : à renseigner dans `src/lib/legal.ts`.
- **Nom** : vérifier que « Passe-Clé » est libre sur https://data.inpi.fr (classes 35, 36 et 42).
- **Indexation Google** : le site est en `noindex` tant qu'il est en construction. À retirer dans `src/app/layout.tsx` au lancement.
- **Retirer les annonces d'exemple** quand les vraies arrivent, avec cette requête : `delete from public.annonces where est_exemple;`
