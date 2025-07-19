-- AlterTable
ALTER TABLE `lecturers` ADD COLUMN `role` VARCHAR(191) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;

ALTER TABLE `students` ADD COLUMN `role` VARCHAR(191) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;

ALTER TABLE `users` MODIFY `title` VARCHAR(191) NOT NULL;

-- Set default values for existing rows after altering tables
UPDATE users SET title = 'mr' WHERE title IS NULL;
UPDATE users SET role = 'student' WHERE role IS NULL;
UPDATE lecturers SET title = 'mr' WHERE title IS NULL;
UPDATE lecturers SET role = 'lecturer' WHERE role IS NULL;
UPDATE students SET title = 'mr' WHERE title IS NULL;
UPDATE students SET role = 'student' WHERE role IS NULL;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
