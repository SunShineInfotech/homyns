-- Tracks the portion of each quotation total posted to a customer's wallet.
-- Run once against the same database used by v1_api/quotation.php.
-- The unique quotation key makes Work In Progress status retries idempotent.
CREATE TABLE IF NOT EXISTS `tbl_quotation_wallet_transaction` (
  `wallet_transaction_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `quotation_id` BIGINT UNSIGNED NOT NULL,
  `client_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Current total already posted to the customer wallet',
  `remark` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`wallet_transaction_id`),
  UNIQUE KEY `uq_quote_wallet_company_quotation` (`company_id`,`quotation_id`),
  KEY `idx_quote_wallet_client` (`company_id`,`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
