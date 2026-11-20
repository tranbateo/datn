-- Add nullable filePath to Document for storing uploaded original PDF files (BR-DOC-001)
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "filePath" TEXT;
