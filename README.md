# Passe-Clé : le vrai site (Next.js + Supabase)

Plateforme de logement étudiant à Rennes : les étudiants qui partent publient leur logement avec une visite virtuelle pièce par pièce, ceux qui arrivent le visitent à distance et contactent le bailleur.

- **Mise en ligne pas à pas :** [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md)
- **Base de données :** `supabase/migrations/` (à coller dans le SQL Editor de Supabase, dans l'ordre)

## Ce que fait le site

| Qui | Peut |
|---|---|
| Visiteur (sans compte) | Chercher et filtrer, voir les annonces et la visite virtuelle, signaler une annonce |
| Membre (compte e-mail + mot de passe) | Voir le contact du bailleur (30 par jour au maximum, chaque consultation est journalisée), enregistrer des logements, publier une annonce avec photos, la retirer ou la marquer attribuée, supprimer son compte |
| Administrateur (`profils.role = 'admin'`) | Tableau de bord chiffré, valider, refuser ou retirer les annonces, traiter les signalements, vérifier ou suspendre les comptes |

Une annonce publiée reste **invisible tant qu'un administrateur ne l'a pas validée**. Si son auteur la modifie, elle repasse en attente de validation.

## Sécurité

- Le navigateur parle à Supabase avec une clé publique. Toute la protection repose sur les règles **RLS** de `0001_schema.sql`.
- Les coordonnées des bailleurs sont dans une table que personne ne lit directement : elles passent par la fonction `voir_contact_bailleur`, qui vérifie la connexion, limite le nombre de consultations et les journalise.
- Un membre ne peut pas se donner le rôle admin : seuls son prénom et son établissement sont modifiables.
- Les photos sont réduites dans le navigateur avant l'envoi, ce qui supprime les métadonnées GPS. Chaque membre n'écrit que dans son propre dossier du stockage.

## Pile

Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, Supabase (Postgres, Auth, Storage), Vercel (hébergement et Analytics).

## Commandes

```
npm install
npm run dev     # http://localhost:3000
npm run build   # vérifie que tout compile
```

En local, les clés sont lues dans le `.env` à la racine du workspace Jarvis (`PASSECLE_SUPABASE_URL`, `PASSECLE_SUPABASE_PUBLISHABLE_KEY`). Sur Vercel, elles sont réglées sous les noms `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Pas encore fait

- Messagerie entre étudiants (pour l'instant : contact direct du bailleur)
- Alertes de recherche par e-mail
- Modification d'une annonce après envoi (aujourd'hui : la retirer et en publier une nouvelle)
- Carte interactive des logements
- Logo (prompt prêt : `../prompt-logo-claude-design.md`)
