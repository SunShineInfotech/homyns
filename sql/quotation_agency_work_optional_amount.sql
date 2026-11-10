-- Allows agency assignments to be saved before an amount is entered.
-- Existing wallet-linked assignments remain linked; unpriced assignments use NULL.
ALTER TABLE `tbl_quotation_agency_work`
  MODIFY COLUMN `wallet_entry_id` BIGINT UNSIGNED DEFAULT NULL
    COMMENT 'NULL when the agency assignment has no amount yet';
