-- Password reset requests submitted by school-provisioned accounts (Student / Teacher / Parent)
CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID,
  "userId" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "resolvedById" UUID,
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE,
  CONSTRAINT "PasswordResetRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "PasswordResetRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "PasswordResetRequest_schoolId_status_idx"
  ON "PasswordResetRequest"("schoolId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "PasswordResetRequest_userId_status_idx"
  ON "PasswordResetRequest"("userId", "status");
