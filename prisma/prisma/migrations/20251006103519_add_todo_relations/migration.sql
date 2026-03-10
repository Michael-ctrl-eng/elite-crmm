-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('Todo', 'InProgress', 'OnHold', 'Done');

-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "linkedId" TEXT NOT NULL,
    "assignedId" TEXT,
    "status" "TodoStatus" NOT NULL,
    "priority" "TodoPriority" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "files" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Todo_linkedId_idx" ON "Todo"("linkedId");

-- CreateIndex
CREATE INDEX "Todo_assignedId_idx" ON "Todo"("assignedId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_linkedId_fkey" FOREIGN KEY ("linkedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_assignedId_fkey" FOREIGN KEY ("assignedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
