/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Friendship` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user1Id,user2Id]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user1Id` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Id` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'REJECTED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_requesterId_fkey";

-- DropIndex
DROP INDEX "Friendship_receiverId_idx";

-- DropIndex
DROP INDEX "Friendship_requestedAt_idx";

-- DropIndex
DROP INDEX "Friendship_requesterId_idx";

-- DropIndex
DROP INDEX "Friendship_requesterId_receiverId_key";

-- DropIndex
DROP INDEX "Friendship_status_idx";

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "receiverId",
DROP COLUMN "requestedAt",
DROP COLUMN "requesterId",
DROP COLUMN "respondedAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "user1Id" TEXT NOT NULL,
ADD COLUMN     "user2Id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "FriendshipStatus";

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FriendRequest_requesterId_idx" ON "FriendRequest"("requesterId");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverId_idx" ON "FriendRequest"("receiverId");

-- CreateIndex
CREATE INDEX "FriendRequest_status_idx" ON "FriendRequest"("status");

-- CreateIndex
CREATE INDEX "FriendRequest_requestedAt_idx" ON "FriendRequest"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_requesterId_receiverId_key" ON "FriendRequest"("requesterId", "receiverId");

-- CreateIndex
CREATE INDEX "Friendship_user1Id_idx" ON "Friendship"("user1Id");

-- CreateIndex
CREATE INDEX "Friendship_user2Id_idx" ON "Friendship"("user2Id");

-- CreateIndex
CREATE INDEX "Friendship_createdAt_idx" ON "Friendship"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user1Id_user2Id_key" ON "Friendship"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
