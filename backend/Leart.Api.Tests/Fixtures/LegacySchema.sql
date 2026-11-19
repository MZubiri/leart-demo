ALTER DATABASE CHARACTER SET utf8mb4;


CREATE TABLE `AdminUsers` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Username` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `LastLoginAt` datetime(6) NULL,
    CONSTRAINT `PK_AdminUsers` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `PersonalizationOrders` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrderReference` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CustomerName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Phone` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `ProductTitle` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `PeopleDetails` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Story` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Phrase` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Requirements` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pendiente',
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_PersonalizationOrders` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Products` (
    `Id` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Kicker` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Category` varchar(60) CHARACTER SET utf8mb4 NOT NULL,
    `Detail` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Image` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Tag` varchar(60) CHARACTER SET utf8mb4 NULL,
    `Group` varchar(60) CHARACTER SET utf8mb4 NULL,
    `OccasionJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `MinFigures` int NOT NULL,
    `MaxFigures` int NOT NULL,
    `VariantsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AllowsPets` tinyint(1) NOT NULL,
    `AllowsAccessories` tinyint(1) NOT NULL,
    `Rule` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `DisplayOrder` int NOT NULL,
    `BasePrice` int NULL,
    `Code` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_Products` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `SiteSettings` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `StoreName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `WhatsAppNumber` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `AnnouncementText` varchar(250) CHARACTER SET utf8mb4 NOT NULL,
    `InstagramUrl` varchar(250) CHARACTER SET utf8mb4 NOT NULL,
    `WhatsAppQuoteTemplate` longtext CHARACTER SET utf8mb4 NOT NULL,
    `WhatsAppPersonalizationTemplate` longtext CHARACTER SET utf8mb4 NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_SiteSettings` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `OrderAttachments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrderId` int NOT NULL,
    `OriginalFileName` varchar(250) CHARACTER SET utf8mb4 NOT NULL,
    `StoredFileName` varchar(250) CHARACTER SET utf8mb4 NOT NULL,
    `FilePath` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `ContentType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `FileSizeBytes` bigint NOT NULL,
    `UploadedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_OrderAttachments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_OrderAttachments_PersonalizationOrders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `PersonalizationOrders` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE UNIQUE INDEX `IX_AdminUsers_Username` ON `AdminUsers` (`Username`);


CREATE INDEX `IX_OrderAttachments_OrderId` ON `OrderAttachments` (`OrderId`);


CREATE INDEX `IX_Products_Category` ON `Products` (`Category`);


CREATE INDEX `IX_Products_IsActive` ON `Products` (`IsActive`);


