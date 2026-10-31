-- Fresh-install schema matching the existing attendance API field names.
CREATE TABLE IF NOT EXISTS `tbl_attendance` (
  `attendance_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` VARCHAR(50) NOT NULL,
  `emp_id` BIGINT NOT NULL,
  `attendance_date` DATE NOT NULL,
  `check_in` DATETIME DEFAULT NULL,
  `lunch_start` DATETIME DEFAULT NULL,
  `lunch_stop` DATETIME DEFAULT NULL,
  `check_out` DATETIME DEFAULT NULL,
  `total_working_hrs` TIME DEFAULT NULL,
  `total_hrs` TIME DEFAULT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'Not Marked',
  `remark` TEXT DEFAULT NULL,
  `is_deleted` ENUM('0','1') NOT NULL DEFAULT '1',
  `c_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uq_attendance_employee_day` (`company_id`,`emp_id`,`attendance_date`),
  KEY `idx_attendance_day` (`company_id`,`attendance_date`),
  KEY `idx_attendance_employee` (`company_id`,`emp_id`,`attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
