"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatFormulaire = { statut: "repos" | "ok" | "erreur"; message?: string; email?: string };

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MDP_MIN = 10;

// N'accepte qu'une destination interne au site (évite les redirections vers un autre site).
export async function destinationSure(suite: unknown, defaut = "/mon-espace") {
  const s = typeof suite === "string" ? suite : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : defaut;
}

async function origine() {
  return (await headers()).get("origin") ?? "";
}

function messageMotDePasse(mdp: string) {
  if (mdp.length < MDP_MIN) return `Le mot de passe doit faire au moins ${MDP_MIN} caractères.`;
  if (!/[a-zA-Z]/.test(mdp) || !/[0-9]/.test(mdp)) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  return null;
}

export async function inscrire(_e: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 60);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mdp = String(formData.get("mot_de_passe") ?? "");

  if (prenom.length < 2) return { statut: "erreur", message: "Indiquez votre prénom.", email };
  if (!EMAIL_VALIDE.test(email)) return { statut: "erreur", message: "Cette adresse e-mail ne semble pas valide.", email };
  const probleme = messageMotDePasse(mdp);
  if (probleme) return { statut: "erreur", message: probleme, email };
  if (formData.get("conditions") !== "on") {
    return { statut: "erreur", message: "Vous devez accepter les conditions d'utilisation.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: mdp,
    options: { data: { prenom }, emailRedirectTo: `${await origine()}/auth/confirm?next=/mon-espace` },
  });

  if (error) {
    if (error.status === 429) {
      return { statut: "erreur", email, message: "Trop de demandes en peu de temps. Réessayez dans quelques minutes." };
    }
    if (error.code === "weak_password") {
      return { statut: "erreur", email, message: "Ce mot de passe est trop facile à deviner. Choisissez-en un autre." };
    }
    return { statut: "erreur", email, message: "L'inscription n'a pas fonctionné. Réessayez dans un instant." };
  }
  // Même réponse si l'adresse a déjà un compte : on ne révèle pas qui est inscrit.
  return { statut: "ok", email };
}

export async function connecter(_e: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mdp = String(formData.get("mot_de_passe") ?? "");
  const suite = await destinationSure(formData.get("suite"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: mdp });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { statut: "erreur", email, message: "Confirmez d'abord votre adresse grâce à l'e-mail reçu à l'inscription." };
    }
    if (error.status === 429) {
      return { statut: "erreur", email, message: "Trop de tentatives. Patientez quelques minutes." };
    }
    return { statut: "erreur", email, message: "E-mail ou mot de passe incorrect." };
  }
  redirect(suite);
}

export async function motDePasseOublie(_e: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDE.test(email)) return { statut: "erreur", message: "Cette adresse e-mail ne semble pas valide.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origine()}/auth/confirm?next=/nouveau-mot-de-passe`,
  });
  if (error?.status === 429) {
    return { statut: "erreur", email, message: "Trop de demandes en peu de temps. Réessayez dans quelques minutes." };
  }
  // Toujours la même réponse, que le compte existe ou non.
  return { statut: "ok", email };
}

export async function changerMotDePasse(_e: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const mdp = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const probleme = messageMotDePasse(mdp);
  if (probleme) return { statut: "erreur", message: probleme };
  if (mdp !== confirmation) return { statut: "erreur", message: "Les deux mots de passe ne sont pas identiques." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: mdp });
  if (error) {
    if (error.code === "same_password") return { statut: "erreur", message: "Choisissez un mot de passe différent de l'ancien." };
    return { statut: "erreur", message: "Le changement n'a pas fonctionné. Redemandez un lien si celui-ci a expiré." };
  }
  redirect("/mon-espace?mdp=1");
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
