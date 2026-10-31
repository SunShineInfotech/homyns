-- Floor plans for Create 3D Quotation. Run against the v1_api database.
CREATE TABLE IF NOT EXISTS `tbl_3d_floor_plan` (
  `plan_id` INT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `client_id` INT DEFAULT NULL,
  `project_title` VARCHAR(180) NOT NULL,
  `bhk` VARCHAR(30) NOT NULL DEFAULT '1 BHK',
  `bedroom_count` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `site_type` VARCHAR(30) NOT NULL DEFAULT 'Flat',
  `ceiling_height_ft` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
  `plan_data` LONGTEXT NOT NULL,
  `thumbnail_path` VARCHAR(255) DEFAULT NULL,
  `map_image_path` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Draft',
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_by` VARCHAR(50) DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `idx_3d_plan_company` (`company_id`,`is_deleted`,`updated_at`),
  KEY `idx_3d_plan_client` (`company_id`,`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
