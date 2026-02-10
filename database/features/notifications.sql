-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- Notification types enum
DO $$ 
BEGIN
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

-- Notifications table
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

-- Index for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC NOTIFICATIONS
-- =============================================

-- Function to notify customer of order status change
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

    -- Notify Vendor (for specific transitions if needed)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status changes
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Function to notify all riders of a new available job
CREATE OR REPLACE FUNCTION notify_new_available_job()
RETURNS TRIGGER AS $$
DECLARE
    rider_record RECORD;
BEGIN
    -- When an order is ready for pickup and has no rider
    IF (NEW.status = 'ready_for_pickup' AND NEW.rider_id IS NULL) THEN
        FOR rider_record IN SELECT id FROM riders WHERE is_available = true LOOP
            INSERT INTO notifications (user_id, title, message, type, order_id)
            VALUES (
                rider_record.id,
                'New Job Available!',
                'A new order from ' || (SELECT business_name FROM vendors WHERE id = NEW.vendor_id) || ' is ready for delivery.',
                'new_job',
                NEW.id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new available jobs
DROP TRIGGER IF EXISTS trigger_notify_new_available_job ON orders;
CREATE TRIGGER trigger_notify_new_available_job
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_available_job();
