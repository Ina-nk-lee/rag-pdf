import "dotenv/config";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// load environment variables from .env.local
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; // NEXT_PUBLIC means public access granted
// const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!; // secret key
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!; // secret key

//  chunk setting
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";

//  chunk text function
function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
) {
  const chunks: string[] = [];
  let i = 0;
  text = text
    .replace(/\s+\n/g, "\n") // remove space that comes before \n
    .replace(/\n{3,}/g, "\n\n"); // leave only \n\n if there's more

  // iterate text to chop it to chunks
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length); // end is an exclusive index in .slice()
    const curr = text.slice(i, end).trim();

    //  add the chunk
    if (curr) {
      chunks.push(curr);
    }

    //  if reached end, break the loop
    if (end === text.length) {
      return chunks;
    }

    //  set the iterator for the next iteration with some overlap
    i = end - overlap;

    //  exception handle
    if (i < 0) {
      i = 0;
    }
  }
  return chunks;
}

async function embedText(text: string) {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // {} optional object
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return res.data[0].embedding;
}

async function main() {
  let text = "";
  text = text.replace(/\u0000/g, "");
  const chunks = chunkText(text);
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: docs, error: docError } = await supabase
    .from("documents")
    .insert({
      title: "test",
      source: "testsource",
    })
    .select("id")
    .single();

  if (docError) {
    console.error("Document error: ", docError);
  }

  const docuId = docs?.id;

  for (let i = 0; i < chunks.length; i++) {
    const embeddings = await embedText(chunks[i]);
    const { error } = await supabase.from("chunks").insert({
      document_id: docuId,
      content: chunks[i],
      embedding: embeddings,
      chunk_index: i,
    });

    if (error) {
      console.error("Chunk error: ", error);
    }
  }

  console.log("Complete.");

  // console.log("Total chunks: ", chunks.length);
  // console.log("1st chunk: ", chunks[0]);
  // console.log("1st chunk: ", chunks[chunks.length - 1]);
}

main();
