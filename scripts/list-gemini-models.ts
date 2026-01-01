import fs from "node:fs";
import path from "node:path";

// Manually parse .env file
function getEnvValue(key) {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const parts = line.split("=");
      if (parts[0].trim() === key) {
        return parts
          .slice(1)
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
    return null;
  } catch (_e) {
    return null;
  }
}

const apiKey = getEnvValue("GOOGLE_GENERATIVE_AI_API_KEY");

if (!apiKey) {
  console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env");
  process.exit(1);
}

async function listModels() {
  try {
    console.log(
      "Fetching available Gemini models using API Key: " +
        apiKey!.substring(0, 8) +
        "...",
    );

    // Using the standard list models endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${await response.text()}`,
      );
    }

    const data = await response.json();
    console.log("\nAvailable Models:");
    if (data.models) {
      data.models.forEach((model) => {
        // Filter for gemini models to be concise
        if (model.name.includes("gemini")) {
          const id = model.name.replace("models/", "");
          console.log(`- ID: ${id}`);
          console.log(`  Name: ${model.displayName}`);
          console.log(
            `  Description: ${model.description ? model.description.substring(0, 100) : ""}...`,
          );
          console.log("---");
        }
      });
    } else {
      console.log("No models found in response:", data);
    }
  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

listModels();
