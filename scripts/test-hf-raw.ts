import "dotenv/config";

async function testRaw() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const url = "https://router.huggingface.co/v1/chat/completions";
  const model = "meta-llama/Meta-Llama-3-8B-Instruct";

  console.log(`Sending Raw Request to ${url} for ${model}...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello!" }],
        stream: false,
        max_tokens: 20,
      }),
    });

    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Body:", text.slice(0, 500)); // Log first 500 chars
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

testRaw();
