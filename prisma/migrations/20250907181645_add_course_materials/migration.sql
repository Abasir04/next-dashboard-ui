-- CreateTable
CREATE TABLE `course_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `originalFilename` VARCHAR(191) NOT NULL,
    `uploadedBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_materials_courseId_fkey`(`courseId`),
    INDEX `course_materials_uploadedBy_fkey`(`uploadedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_materials` ADD CONSTRAINT `course_materials_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_materials` ADD CONSTRAINT `course_materials_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `lecturers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
