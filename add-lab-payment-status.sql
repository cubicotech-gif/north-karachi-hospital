-- Add payment tracking to lab_orders.
-- This is the only billable table missing payment_status (opd_tokens and
-- treatments already have it), which is why every lab invoice showed "unpaid"
-- and the patient-file "Record Payment" action failed for labs.
--
-- Run once in the Supabase SQL editor. Safe to re-run: the backfill only
-- happens the first time, when the column is created.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';

    -- Existing lab orders are historical and treated as already collected.
    -- New orders created after this migration default to 'pending' (unpaid).
    UPDATE lab_orders SET payment_status = 'paid';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_status ON lab_orders(payment_status);
