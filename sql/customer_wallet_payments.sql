-- Run once on the application database before using Customer Master > Wallet.
-- Payment receipt rows are linked to tbl_transaction for the finance account ledger.
CREATE TABLE IF NOT EXISTS `tbl_customer_wallet_payment` (
  `payment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `payment_number` VARCHAR(80) NOT NULL,
  `client_id` BIGINT UNSIGNED NOT NULL,
  `account_id` BIGINT UNSIGNED NOT NULL,
  `transaction_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `remark` TEXT DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_customer_wallet_payment_number` (`company_id`,`payment_number`),
  UNIQUE KEY `uq_customer_wallet_payment_transaction` (`company_id`,`transaction_id`),
  KEY `idx_customer_wallet_payment_client` (`company_id`,`client_id`,`payment_date`),
  KEY `idx_customer_wallet_payment_account` (`company_id`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
