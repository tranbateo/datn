-- AlterTable School
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "licenseKey" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "licenseExpiresAt" TIMESTAMP(3);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER NOT NULL DEFAULT 500;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "aiTokenQuota" INTEGER NOT NULL DEFAULT 10000000;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "aiTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "customApiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "School_licenseKey_key" ON "School"("licenseKey");

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentCode" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_schoolId_studentCode_key" ON "User"("schoolId", "studentCode");

-- AlterTable ParentStudentLink
ALTER TABLE "ParentStudentLink" ADD COLUMN IF NOT EXISTS "relationship" TEXT;
ALTER TABLE "ParentStudentLink" ALTER COLUMN "linkCode" DROP NOT NULL;

-- CreateTable AcademicYear
CREATE TABLE IF NOT EXISTS "AcademicYear" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable Class
CREATE TABLE IF NOT EXISTS "Class" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "homeroomTeacherId" UUID,
    "inviteCode" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable ClassSubjectTeacher
CREATE TABLE IF NOT EXISTS "ClassSubjectTeacher" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ClassSubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable ClassEnrollment
CREATE TABLE IF NOT EXISTS "ClassEnrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_inviteCode_key" ON "Class"("inviteCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_schoolId_academicYearId_name_key" ON "Class"("schoolId", "academicYearId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassSubjectTeacher_classId_subjectId_key" ON "ClassSubjectTeacher"("classId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassEnrollment_classId_studentId_key" ON "ClassEnrollment"("classId", "studentId");

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTeacher" ADD CONSTRAINT "ClassSubjectTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTeacher" ADD CONSTRAINT "ClassSubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectTeacher" ADD CONSTRAINT "ClassSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

