-- Add payment tracking to lab_orders.
-- This is the only billable table missing payment_status (opd_tokens and
-- treatments already have it), which is why every lab invoice showed "unpaid"
-- and the patient-file "Record Payment" action failed for labs.
--
-- Payment was never recorded for labs before this column existed, so there is
-- no basis to mark historical orders as paid. The column defaults to 'pending'
-- (unpaid); staff mark each order paid via the lab module / patient file once
-- payment is actually collected.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_status ON lab_orders(payment_status);
