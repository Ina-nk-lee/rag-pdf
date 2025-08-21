# RAG PDF (WIP)

This is an experimental **RAG (Retrieval-Augmented Generation)** project built with **Next.js**, **TypeScript**, and **Supabase**.  
The goal is to ingest PDF documents, generate embeddings with **OpenAI API**, and store them in a **Postgres (pgvector)** database for semantic search and question answering.

## Current Status

- Initialized Next.js project with TypeScript
- Added `.env` and set up environment variables
- Verified **OpenAI embeddings API** connection (`text-embedding-3-small`)

```bash
npx tsx scripts/test-openai.ts
# Embedding length: 1536
```
