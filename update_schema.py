import re

with open('code/backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update Enums and add School
text = text.replace('''enum Role {
  STUDENT
  TEACHER
  ADMIN
  PARENT
}''', '''enum Role {
  STUDENT
  TEACHER
  ADMIN
  SCHOOL_ADMIN
  PARENT
}

enum SchoolLevel {
  PRIMARY
  MIDDLE
  HIGH
  ALL
}

model School {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  code      String   @unique
  level     SchoolLevel @default(ALL)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users        User[]
  courses      Course[]
  documents    Document[]
  quizzes      Quiz[]
  chatSessions ChatSession[]
}''')

# 2. Add schoolId to User
text = text.replace('''model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique''', '''model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId  String?  @db.Uuid
  school    School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  email     String   @unique''')

# 3. Add schoolId to Course
text = text.replace('''model Course {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String''', '''model Course {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId    String?  @db.Uuid
  school      School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  title       String''')

# 4. Add schoolId to Document
text = text.replace('''model Document {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId  String   @db.Uuid''', '''model Document {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId  String?  @db.Uuid
  school    School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  courseId  String   @db.Uuid''')

# 5. Add schoolId to ChatSession
text = text.replace('''model ChatSession {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @db.Uuid''', '''model ChatSession {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId  String?  @db.Uuid
  school    School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  userId    String   @db.Uuid''')

# 6. Add schoolId to Quiz
text = text.replace('''model Quiz {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String''', '''model Quiz {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  schoolId    String?  @db.Uuid
  school      School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  title       String''')

with open('code/backend/prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated prisma schema.')
