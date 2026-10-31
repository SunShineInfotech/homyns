-- Run once on the same database used by the quotation API.
-- Stores the latest date and time Invoice Generated status was applied.
ALTER TABLE `tbl_quotation`
  ADD COLUMN `invoice_generated_at` DATETIME NULL DEFAULT NULL
    COMMENT 'Latest Invoice Generated status timestamp';
