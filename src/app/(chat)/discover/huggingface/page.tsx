import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverCard } from "@/components/discover/discover-card";
import { HuggingFaceIcon } from "@/components/ui/hugging-face-icon";

interface HFModel {
  id: string; // The model ID e.g. 'meta-llama/Llama-2-7b'
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag: string;
}

// Map pipeline tags to icons
const ICON_MAP: Record<string, string> = {
  "text-generation": "💬",
  "text-to-image": "🎨",
  conversational: "🗨️",
  "feature-extraction": "🔍",
  summarization: "📝",
  translation: "🌐",
};

async function getTopHFModels(): Promise<HFModel[]> {
  try {
    const res = await fetch(
      "https://huggingface.co/api/models?sort=likes&direction=-1&limit=100",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];

    // Safety check if response is not array
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const allowedPipelines = [
      "text-generation",
      "text-to-image",
      "conversational",
      "feature-extraction",
      "summarization",
      "translation",
    ];

    return data.filter(
      (model: any) =>
        model.pipeline_tag && allowedPipelines.includes(model.pipeline_tag),
    );
  } catch (error) {
    console.error("Failed to fetch HF models", error);
    return [];
  }
}

export default async function HuggingFaceDiscoverPage() {
  const models = await getTopHFModels();

  return (
    <DiscoverLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <HuggingFaceIcon className="w-5 h-5 text-[#FFD21E]" />
              Top 100 Trending Models
            </h2>
            <span className="text-sm text-muted-foreground">
              Real-time from Hugging Face
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Explore the most popular AI models. Note: Not all models are
            instantly compatible with One Click Chat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map((model: HFModel) => (
            <DiscoverCard
              key={model.id}
              id={model.id}
              type="agent"
              title={model.id.split("/")[1] || model.id}
              description={`${model.pipeline_tag} model by ${model.id.split("/")[0]}. Tags: ${model.tags.slice(0, 3).join(", ")}`}
              icon={ICON_MAP[model.pipeline_tag] || "🤖"}
              author={{
                name: model.id.split("/")[0], // e.g. meta-llama
                avatar: undefined,
              }}
              tags={model.tags.slice(0, 3)}
              usageCount={model.downloads}
              customActionLabel={
                ["text-generation", "conversational"].includes(
                  model.pipeline_tag,
                )
                  ? "Chat Now"
                  : model.pipeline_tag === "text-to-image"
                    ? "Generate Image"
                    : "View on HF"
              }
              customActionLink={
                ["text-generation", "conversational"].includes(
                  model.pipeline_tag,
                )
                  ? `/?provider=Hugging Face&model=${model.id}`
                  : model.pipeline_tag === "text-to-image"
                    ? `/image?provider=huggingface&model=${model.id}`
                    : `https://huggingface.co/${model.id}`
              }
            />
          ))}
        </div>
      </div>
    </DiscoverLayout>
  );
}
