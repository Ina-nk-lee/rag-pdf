# RAG PDF (WIP)

This is an experimental **RAG (Retrieval-Augmented Generation)** project built with **Next.js**, **TypeScript**, and **Supabase**.  
The goal is to ingest PDF documents, generate embeddings with **OpenAI API**, and store them in a **Postgres (pgvector)** database for semantic search and question answering.

## Current Status

- Initialized Next.js project with TypeScript
- Added `.env.local` and set up environment variables
- Verified **OpenAI embeddings API** connection (`text-embedding-3-small`)
- Implemented **text chunking utility** (`chunkText()`) with overlap

```bash
npx tsx scripts/test-openai.ts
# Embedding length: 1536
```

## Chunking Strategy

We split long texts into overlapping chunks before embedding:

- CHUNK_SIZE = 800 characters
- CHUNK_OVERLAP = 100 characters
- Pre-normalize whitespace:
- Collapse spaces before newlines: /\s+\n/g → '\n'
- Reduce 3+ newlines to double newline: /\n{3,}/g → '\n\n'

Why?
Overlapping chunks preserve context across boundaries; normalizing whitespace reduces noise so embeddings are more stable.
