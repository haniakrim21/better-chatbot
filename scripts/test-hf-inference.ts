import "dotenv/config";

async function testInference() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error("HUGGINGFACE_API_KEY is missing");
    return;
  }

  const _textModel = "meta-llama/Meta-Llama-3-8B-Instruct";
  const imageModel = "black-forest-labs/FLUX.1-dev";
  const embeddingModel = "sentence-transformers/all-MiniLM-L6-v2";

  console.log("API Key found. Testing Router endpoints...");

  // Test 1: OpenAI Compatible Embeddings
  console.log("\n--- Test 1: v1/embeddings ---");
  const embedUrl = "https://router.huggingface.co/v1/embeddings";
  try {
    const res = await fetch(embedUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: "Hello world",
      }),
    });
    console.log(`Status: ${res.status}`);
    if (!res.ok) console.log("Error:", await res.text());
    else
      console.log(
        "Success:",
        (await res.json()).data?.[0]?.embedding?.slice(0, 5) + "...",
      );
  } catch (e) {
    console.error(e);
  }

  // Test 2: OpenAI Compatible Image Generation
  console.log("\n--- Test 2: v1/images/generations ---");
  const imgUrl = "https://router.huggingface.co/v1/images/generations";
  try {
    const res = await fetch(imgUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: "A cute robot cat",
        n: 1,
        size: "1024x1024",
      }),
    });
    console.log(`Status: ${res.status}`);
    if (!res.ok) console.log("Error:", await res.text());
    else
      console.log("Success:", JSON.stringify(await res.json()).slice(0, 100));
  } catch (e) {
    console.error(e);
  }

  // Test 3: Task API for Image Model
  console.log("\n--- Test 3: Task API (Router) for Image Model ---");
  const taskUrl = `https://router.huggingface.co/models/${imageModel}`;
  try {
    const res = await fetch(taskUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: "A cute robot cat" }),
    });
    console.log(`Testing: ${taskUrl}`);
    console.log(`Status: ${res.status}`);
    if (!res.ok) console.log("Error:", await res.text());
    else console.log("Success! (Buffer/Blob received)");
  } catch (e) {
    console.error(e);
  }
}

testInference();
