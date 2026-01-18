async function main() {
  const identifier = "lateral-thinking-puzzle";
  const url = `https://chat-agents.lobehub.com/${identifier}.json`; // Guessing URL structure
  console.log("Fetching:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        "Failed to fetch detail JSON:",
        response.status,
        response.statusText,
      );
      // Try alternate URL structure if needed, e.g. raw github?
      // defaults in lobehub repo are usually at src/agents/[id]/index.json ??
      // But this is a deployment.
    } else {
      const data = await response.json();
      console.log("Keys:", Object.keys(data));
      console.log("systemRole:", data.systemRole);
      console.log("config:", JSON.stringify(data.config, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

main();
