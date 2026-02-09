-- =============================================
-- AUTOMATIC MIGRATION: NOTIFICATIONS SYSTEM
-- =============================================
-- Run this script to install the notifications tables and triggers

-- 1. Create the Notification Type if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'order_update',
            'new_job',
            'payment_success',
            'payment_failed',
            'system_alert'
        );
    END IF;
END $$;

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 4. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Functions & Triggers
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Notify Customer
    INSERT INTO notifications (user_id, title, message, type, order_id)
    VALUES (
      NEW.customer_id,
      'Order Update',
      'Your order #' || NEW.order_number || ' is now ' || REPLACE(NEW.status::text, '_', ' ') || '.',
      'order_update',
      NEW.id
    );

    -- Notify Rider if assigned
    IF (NEW.rider_id IS NOT NULL) THEN
        INSERT INTO notifications (user_id, title, message, type, order_id)
        VALUES (
          NEW.rider_id,
          'Order Update',
          'Assigned order #' || NEW.order_number || ' status changed to ' || REPLACE(NEW.status::text, '_', ' ') || '.',
          'order_update',
          NEW.id
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- New Job Trigger
CREATE OR REPLACE FUNCTION notify_new_available_job()
RETURNS TRIGGER AS $$
DECLARE
    rider_record RECORD;
BEGIN
    IF (NEW.status = 'ready_for_pickup' AND NEW.rider_id IS NULL) THEN
        FOR rider_record IN SELECT id FROM riders WHERE is_available = true LOOP
            INSERT INTO notifications (user_id, title, message, type, order_id)
            VALUES (
                rider_record.id,
                'New Job Available!',
                'A new order is ready for delivery.',
                'new_job',
                NEW.id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_available_job ON orders;
CREATE TRIGGER trigger_notify_new_available_job
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_available_job();
