import "dotenv/config";
import pdf from "pdf-parse";
import fs from "fs";
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

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // {} optional object

//  read from PDF
async function readPDF(path: string) {
  const buf = fs.readFileSync(path);
  const data = await pdf(buf);
  return data.text;
}

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
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return res.data[0].embedding;
}

async function answerFromContext(question: string, hits: any[]) {
  if(hits.length === 0) {
    return "Context not found"
  }
  const context = hits
    .map(
      (h: any, j: number) =>
        `[#${j} score=${h.score} chunk_index=${h.chunk_index}]\n${h.content}`
    )
    .join("\n\n---\n\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Answer ONLY using the provided context. If the answer is not in the context, say you don't know.",
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });

  return res.choices[0].message.content;
}

async function main() {
  let text = await readPDF("scripts/test.pdf");
  text = text.replace(/\u0000/g, ""); // postprocess the text to stabilize it
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

const q = "Show me one sentence about `Adam Raine`.";
const qEmb = await embedText(q);

const { data: hits, error: hitErr } = await supabase.rpc("match_chunks", {
  query_embedding: qEmb,
  match_count: 15,
  doc_id: docuId, 
});

console.log("hitErr:", hitErr);
console.log(
  hits?.map((h: any) => ({
    score: h.score,
    idx: h.chunk_index,
    preview: h.content.slice(0, 120),
  }))
);

const ans = await answerFromContext(q, hits ?? [])
console.log("\n=== ANSWER ===\n", ans);

console.log("Complete.");

  // console.log("Total chunks: ", chunks.length);
  // console.log("1st chunk: ", chunks[0]);
  // console.log("1st chunk: ", chunks[chunks.length - 1]);
}

main();
