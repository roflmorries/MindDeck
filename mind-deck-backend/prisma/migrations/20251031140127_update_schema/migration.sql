/*
  Warnings:

  - You are about to drop the column `passwodHash` on the `users` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwodHash",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "passwordHash" TEXT NOT NULL;
