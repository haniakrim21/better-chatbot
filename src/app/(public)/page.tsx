import { getSession } from "lib/auth/server";
import { redirect } from "next/navigation";

export default async function PublicPage() {
  const session = await getSession();

  if (session) {
    redirect("/chat");
  } else {
    redirect("/sign-in");
  }
}
