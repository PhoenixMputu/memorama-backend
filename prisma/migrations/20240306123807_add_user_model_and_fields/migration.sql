-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lastname` VARCHAR(15) NOT NULL,
    `firstname` VARCHAR(20) NOT NULL,
    `username` VARCHAR(30) NULL,
    `email` VARCHAR(100) NOT NULL,
    `state` ENUM('active', 'pending') NOT NULL DEFAULT 'pending',
    `password` VARCHAR(255) NULL,
    `dateOfBirth` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
