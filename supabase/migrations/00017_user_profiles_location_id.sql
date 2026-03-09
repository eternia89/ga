-- Add location_id to user_profiles for office location assignment
ALTER TABLE user_profiles ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Partial index for active users with location
CREATE INDEX idx_user_profiles_location_id ON user_profiles(location_id) WHERE deleted_at IS NULL;
