-- Run once before enabling Master > Work Types and Agency work type selection.
CREATE TABLE IF NOT EXISTS `tbl_work_type` (
  `work_type_id` INT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`work_type_id`),
  UNIQUE KEY `uq_work_type_company_name` (`company_id`,`name`),
  KEY `idx_work_type_company_active` (`company_id`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_agency_work_type` (
  `agency_id` BIGINT NOT NULL,
  `work_type_id` INT NOT NULL,
  `company_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`agency_id`,`work_type_id`),
  KEY `idx_agency_work_type_company` (`company_id`,`work_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
