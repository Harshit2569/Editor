-- Enable Row Level Security on the Document table
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to see and edit documents they own or have been granted access to
CREATE POLICY doc_access ON "Document"
  USING (
    "ownerId" = current_setting('app.user_id', true)
    OR id IN (
      SELECT "documentId" FROM "DocumentRole" WHERE "userId" = current_setting('app.user_id', true)
    )
  );

-- For robust RLS, we'd need to set the `app.user_id` setting for each database connection.
-- Since Prisma doesn't support connection-level session variables easily in a connection pool,
-- we'll rely on Application-Level Security (Prisma queries scoped to user ID) as the primary 
-- enforcement mechanism, but this SQL serves as the foundational database-level RLS design.
