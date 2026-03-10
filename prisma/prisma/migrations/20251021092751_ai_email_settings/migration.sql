/*
  Warnings:

  - You are about to drop the column `ownerId` on the `EmailSettings` table. All the data in the column will be lost.
  - Added the required column `userId` to the `EmailSettings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."EmailSettings" DROP CONSTRAINT "EmailSettings_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."EmailSettings_ownerId_idx";

-- AlterTable
ALTER TABLE "EmailSettings" DROP COLUMN "ownerId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "EmailSettings_userId_idx" ON "EmailSettings"("userId");

-- AddForeignKey
ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
