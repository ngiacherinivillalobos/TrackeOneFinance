-- Migration: Add savings_goals table (PostgreSQL version)
-- This will allow users to save their savings goals with proper persistence

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    target_date DATE NOT NULL,
    cost_center_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_cost_center ON savings_goals(cost_center_id);