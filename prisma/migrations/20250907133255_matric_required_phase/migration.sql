/*
  Warnings:

  - Made the column `matricNumber` on table `course_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `matricNumber` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `course_registrations` MODIFY `matricNumber` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `students` MODIFY `matricNumber` VARCHAR(191) NOT NULL;
