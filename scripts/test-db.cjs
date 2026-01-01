const { Client } = require("pg");
const url =
  process.env.POSTGRES_URL ||
  "postgres://your_username:your_password@localhost:5432/your_database_name";
console.log("Testing connection to:", url.replace(/:[^:@]*@/, ":****@")); // Hide password

const client = new Client({
  connectionString: url,
});

client
  .connect()
  .then(() => {
    console.log("Connected successfully!");
    return client.query("SELECT 1");
  })
  .then((res) => {
    console.log("Query result:", res.rows[0]);
    client.end();
  })
  .catch((err) => {
    console.error("Connection failed:", err);
    client.end();
  });
