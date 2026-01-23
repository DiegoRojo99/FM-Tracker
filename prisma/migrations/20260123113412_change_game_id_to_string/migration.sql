/*
  Warnings:

  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "CareerChallenge" DROP CONSTRAINT "CareerChallenge_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Save" DROP CONSTRAINT "Save_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Trophy" DROP CONSTRAINT "Trophy_gameId_fkey";

-- AlterTable
ALTER TABLE "CareerChallenge" ALTER COLUMN "gameId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Game_id_seq";

-- AlterTable
ALTER TABLE "Save" ALTER COLUMN "gameId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Trophy" ALTER COLUMN "gameId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerChallenge" ADD CONSTRAINT "CareerChallenge_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
