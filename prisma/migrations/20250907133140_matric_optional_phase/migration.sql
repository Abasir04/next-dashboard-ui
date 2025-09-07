/*
  Warnings:

  - You are about to drop the column `studentId` on the `course_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matricNumber]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `students_studentId_key` ON `students`;

-- AlterTable
ALTER TABLE `course_registrations` DROP COLUMN `studentId`,
    ADD COLUMN `matricNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `students` DROP COLUMN `studentId`,
    ADD COLUMN `matricNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `students_matricNumber_key` ON `students`(`matricNumber`);
