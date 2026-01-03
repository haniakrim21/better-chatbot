async function inspect() {
  const res = await fetch(
    "https://huggingface.co/api/models?sort=likes&direction=-1&limit=1&expand[]=cardData",
  );
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));
}
inspect();
