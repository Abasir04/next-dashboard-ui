/*
  Warnings:

  - You are about to drop the column `levelId` on the `course_registration_links` table. All the data in the column will be lost.
  - You are about to drop the column `levelId` on the `course_registrations` table. All the data in the column will be lost.
  - Added the required column `level` to the `course_registration_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `course_registrations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `course_registration_links` DROP FOREIGN KEY `course_registration_links_levelId_fkey`;

-- DropForeignKey
ALTER TABLE `course_registrations` DROP FOREIGN KEY `course_registrations_levelId_fkey`;

-- DropIndex
DROP INDEX `course_registration_links_levelId_fkey` ON `course_registration_links`;

-- DropIndex
DROP INDEX `course_registrations_levelId_fkey` ON `course_registrations`;

-- AlterTable
ALTER TABLE `course_registration_links` DROP COLUMN `levelId`,
    ADD COLUMN `level` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `course_registrations` DROP COLUMN `levelId`,
    ADD COLUMN `level` INTEGER NOT NULL;
