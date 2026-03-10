/*
  Warnings:

  - The values [Qualified] on the enum `DealStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DealStage_new" AS ENUM ('New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost');
ALTER TABLE "Deal" ALTER COLUMN "stage" TYPE "DealStage_new" USING ("stage"::text::"DealStage_new");
ALTER TYPE "DealStage" RENAME TO "DealStage_old";
ALTER TYPE "DealStage_new" RENAME TO "DealStage";
DROP TYPE "public"."DealStage_old";
COMMIT;
