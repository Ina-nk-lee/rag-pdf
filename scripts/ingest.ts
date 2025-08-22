import "dotenv/config";
import pdf from "pdf-parse";

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
