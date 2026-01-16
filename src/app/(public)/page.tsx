import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { getSession } from "lib/auth/server";
import { redirect } from "next/navigation";

export default async function PublicPage() {
  const session = await getSession();

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
