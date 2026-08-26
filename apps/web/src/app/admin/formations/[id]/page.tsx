import { redirect } from "next/navigation";

// Ancienne page d'édition à page unique (6 Cards empilées), remplacée par
// l'assistant en étapes (admin/formations/nouvelle?id=...). Conservée comme
// redirection — pas une suppression sèche — pour que les liens/favoris
// existants continuent de fonctionner.
export default async function EditFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/formations/nouvelle?id=${id}`);
}
