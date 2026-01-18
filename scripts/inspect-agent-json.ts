async function main() {
  const response = await fetch("https://chat-agents.lobehub.com/index.json");
  const data = await response.json();
  const agents = Array.isArray(data) ? data : data.agents;

  console.log("Count:", agents.length);
  console.log("First Agent:", JSON.stringify(agents[0], null, 2));

  // Find one that was skipped to see its structure
  const skipped = agents.find(
    (a: any) => a.identifier === "discord-copywriting",
  );
  if (skipped) {
    console.log(
      "\nSkipped Agent (discord-copywriting):",
      JSON.stringify(skipped, null, 2),
    );
  }
}

main();
