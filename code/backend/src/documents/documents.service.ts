import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class DocumentsService {
  private vectorStore: SupabaseVectorStore;

  constructor() {
    const client = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_PRIVATE_KEY || ''
    );
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
  }

  async processAndIngestDocument(file: Express.Multer.File, courseId: string) {
    try {
      // 1. Parse PDF using Blob
      const blob = new Blob([new Uint8Array(file.buffer)], { type: 'application/pdf' });
      const loader = new PDFLoader(blob);
      const rawDocs = await loader.load();

      // 2. Add metadata (courseId and filename)
      const docsWithMetadata = rawDocs.map(doc => {
        doc.metadata = {
          ...doc.metadata,
          courseId,
          fileName: file.originalname,
        };
        return doc;
      });

      // 3. Chunk text (1000 chars, 200 overlap)
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(docsWithMetadata);

      // 4. Ingest to Vector Store (this will call Gemini to create embeddings and save to Supabase)
      await this.vectorStore.addDocuments(splitDocs);

      return {
        message: 'Document successfully ingested',
        chunks: splitDocs.length,
      };
    } catch (error) {
      console.error('Error ingesting document:', error);
      throw new InternalServerErrorException('Failed to process document');
    }
  }
}
