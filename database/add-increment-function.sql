-- Function to safely increment a numeric column in any table
CREATE OR REPLACE FUNCTION increment(table_name TEXT, row_id UUID, column_name TEXT, amount DECIMAL)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING amount, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
