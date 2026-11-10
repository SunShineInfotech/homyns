-- Run once on the application database to enable company-scoped agencies.
-- Then run agency_wallet_migration.sql to add opening balances and wallet entries.
CREATE TABLE IF NOT EXISTS `tbl_agency` (
  `agency_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `agency_name` VARCHAR(150) NOT NULL,
  `firm_name` VARCHAR(150) DEFAULT NULL,
  `contact_person` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `whatsapp_number` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `state_id` BIGINT DEFAULT NULL,
  `city_id` BIGINT DEFAULT NULL,
  `area_id` BIGINT DEFAULT NULL,
  `gst_number` VARCHAR(30) DEFAULT NULL,
  `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`agency_id`),
  KEY `idx_agency_company` (`company_id`,`is_deleted`,`agency_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
