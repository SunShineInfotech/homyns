-- Run after sql/work_types.sql and sql/agency_wallet_migration.sql.
-- Stores one immutable agency assignment per work type on a quotation.
CREATE TABLE IF NOT EXISTS `tbl_quotation_agency_work` (
  `assignment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `quotation_id` INT(11) NOT NULL,
  `work_type_id` INT NOT NULL,
  `agency_id` BIGINT NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `remark` VARCHAR(500) NOT NULL,
  `wallet_entry_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL when the agency assignment has no amount yet',
  `emp_id` VARCHAR(50) DEFAULT NULL,
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uq_quote_work_type` (`company_id`,`quotation_id`,`work_type_id`),
  UNIQUE KEY `uq_agency_wallet_entry` (`wallet_entry_id`),
  KEY `idx_quote_agency_work_agency` (`company_id`,`agency_id`,`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
