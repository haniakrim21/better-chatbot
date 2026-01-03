async function testHF() {
  const url =
    "https://huggingface.co/api/models?sort=likes&direction=-1&limit=10&filter=text-generation";
  try {
    console.log("Fetching:", url);
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (!res.ok) {
      console.log("Error body:", await res.text());
      return;
    }
    const data = await res.json();
    console.log(
      "Data length:",
      Array.isArray(data) ? data.length : "Not array",
    );
    if (Array.isArray(data) && data.length > 0) {
      console.log("First item:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Data:", data);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testHF();
