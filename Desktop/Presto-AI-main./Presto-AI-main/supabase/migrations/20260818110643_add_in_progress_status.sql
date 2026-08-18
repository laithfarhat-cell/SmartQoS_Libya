/*
# Add in_progress ticket status

1. Changes
   - Alter the `dev_tickets.status` CHECK constraint to include 'in_progress'
     alongside 'open', 'resolved', 'dismissed'.
2. Security
   - No policy changes.
*/

ALTER TABLE dev_tickets DROP CONSTRAINT IF EXISTS dev_tickets_status_check;

ALTER TABLE dev_tickets
  ADD CONSTRAINT dev_tickets_status_check
  CHECK (status IN ('open','resolved','dismissed','in_progress'));
