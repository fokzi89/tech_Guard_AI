-- User notification preferences table
-- This table stores user-specific notification preferences for email and in-app notifications
-- Includes both regular user notifications and admin-specific notifications

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Email notification preferences
    email_notifications BOOLEAN DEFAULT true,
    email_safety_alerts BOOLEAN DEFAULT true,
    email_report_ready BOOLEAN DEFAULT true,
    email_session_summary BOOLEAN DEFAULT false,

    -- In-app notification preferences
    in_app_notifications BOOLEAN DEFAULT true,
    in_app_safety_alerts BOOLEAN DEFAULT true,

    -- Admin-specific notification preferences (only relevant for org_admin and super_admin)
    admin_new_user_alerts BOOLEAN DEFAULT true,
    admin_safety_incident_alerts BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one preferences record per user
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view and manage their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups by user_id
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before UPDATE
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create default preferences for all existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE user_preferences IS 'Stores user notification preferences for email and in-app notifications';
