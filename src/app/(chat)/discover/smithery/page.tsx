import { DiscoverLayout } from "@/components/discover/discover-layout";
import { SmitheryBrowser } from "@/components/smithery-browser";
import { getTranslations } from "next-intl/server";

export default async function SmitheryPage() {
  const _t = await getTranslations();

  return (
    <DiscoverLayout>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Smithery Registry
          </h2>
          <p className="text-muted-foreground">
            Discover and install popular MCPs directly from Smithery.ai.
          </p>
        </div>

        <SmitheryBrowser />
      </div>
    </DiscoverLayout>
  );
}
