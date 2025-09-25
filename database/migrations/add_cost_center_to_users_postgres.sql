-- Migration: Add cost_center_id to users table (PostgreSQL version)
-- This will allow users to be associated with cost centers for automatic filtering
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cost_center_id') THEN
    ALTER TABLE users ADD COLUMN cost_center_id INTEGER;
    
    -- Add foreign key constraint
    -- Usando bloco DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE users ADD CONSTRAINT fk_users_cost_center 
      FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);
  END IF;
END $$;

-- Create index for better performance on cost_center_id queries
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_users_cost_center' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_users_cost_center ON users(cost_center_id);
  END IF;
END $$;