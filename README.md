# RAG PDF (WIP)

This is an experimental **RAG (Retrieval-Augmented Generation)** project built with **Next.js**, **TypeScript**, and **Supabase**.  
The goal is to ingest PDF documents, generate embeddings with **OpenAI API**, and store them in a **Postgres (pgvector)** database for search and question answering.

## Current Status

- Initialized Next.js project with TypeScript
- Added `.env.local` and set up environment variables
- Checked **OpenAI embeddings API** connection (`text-embedding-3-small`)
- Implemented **text chunking utility** (`chunkText()`) with overlap
- Added PDF parsing using pdf-parse
- Inserted documents into Supabase documents table and linked chunks table with embeddings using document_id

1. Test OpenAI Connection

```bash
npx tsx scripts/test-openai.ts
# Embedding length: 1536
```

2. Ingest PDF

```bash
   npx tsx scripts/ingest.ts
```

This will:

1. Parse the PDF into raw text
2. Split text into overlapping chunks (800 chars, 100 overlap)
3. Insert a new row in documents table
4. Embed each chunk with OpenAI (text-embedding-3-small)
5. Insert chunk + embedding vectors into chunks table with document_id

## Chunking Strategy

We split long texts into overlapping chunks before embedding:

- CHUNK_SIZE = 800 characters
- CHUNK_OVERLAP = 100 characters
- Normalize whitespace
- Remove spaces before newlines
- Reduce 3+ newlines to double newline

### Why?

Overlapping chunks preserve context across boundaries; normalizing whitespace reduces noise so embeddings are more stable.

## Next Step

• Add a query API route in Next.js that:

1. Embeds the user query
2. Performs a vector similarity search in Supabase
3. Returns the most relevant chunks for answer generation
