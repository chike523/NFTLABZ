-- =============================================
-- Minting Fee Setting
-- Run this on Supabase to seed/update the minting fee configuration
-- =============================================

INSERT INTO site_settings (key, value, category, type, label, description, is_public)
VALUES (
  'minting_fee_eth',
  '0',
  'general',
  'number',
  'Minting Fee (ETH)',
  'Platform fee charged in ETH whenever a user mints a new NFT. Set to 0 to disable.',
  true
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;


