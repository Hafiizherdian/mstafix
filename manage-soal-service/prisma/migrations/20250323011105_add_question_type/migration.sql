/*
  Warnings:

  - Added the required column `type` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "options" DROP NOT NULL;
