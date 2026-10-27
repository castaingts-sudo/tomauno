import { redirect } from "next/navigation";

// Sin rol en la URL se abre la hoja del director.
export default async function HojaIndex({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/e/${(await params).id}/director`);
}
