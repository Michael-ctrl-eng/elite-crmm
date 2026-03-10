-- CreateEnum
CREATE TYPE "userStatus" AS ENUM ('Active', 'Inactive', 'Invite');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "userStatus" NOT NULL DEFAULT 'Inactive';
