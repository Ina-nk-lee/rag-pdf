import "dotenv/config";
import OpenAI from "openai";

// load environment variables from .env.local
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
// const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; // NEXT_PUBLIC means public access granted
// const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!; // secret key
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!; // secret key

async function main() {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // {} optional object
  const input = "Embedding test";
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  const vector = res.data[0].embedding;
  console.log("Embedding length: ", vector.length);
}

main();
