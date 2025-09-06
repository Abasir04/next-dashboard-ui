/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the table `courses` without a default value. This is not possible if the table is not empty.
  - Added the required column `lecturerId` to the table `courses` without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the table `courses` without a default value. This is not possible if the table is not empty.

*/

-- First, add the columns with default values
ALTER TABLE `courses` ADD COLUMN `code` VARCHAR(191) DEFAULT '',
    ADD COLUMN `lecturerId` INTEGER DEFAULT 1,
    ADD COLUMN `level` INTEGER DEFAULT 100;

-- Update existing courses with generated codes and default values
UPDATE `courses` SET 
    `code` = CONCAT('CSE', LPAD(id, 3, '0')),
    `lecturerId` = 1,
    `level` = 100;

-- Now make the columns NOT NULL
ALTER TABLE `courses` MODIFY COLUMN `code` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `lecturerId` INTEGER NOT NULL,
    MODIFY COLUMN `level` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `courses_code_key` ON `courses`(`code`);

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `lecturers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;