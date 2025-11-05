-- =============================================
-- Support Chat Widget Setting
-- Add this to your site_settings table
-- =============================================

-- Add support chat code setting
INSERT INTO site_settings (key, value, category, type, label, description, is_public)
VALUES (
  'support_chat_code',
  NULL,
  'general',
  'textarea',
  'Support Chat Widget Code',
  'Paste the complete script code from your chat provider (Tawk.to, Intercom, Crisp, etc.). Leave empty to disable.',
  true
)
ON CONFLICT (key) DO UPDATE SET is_public = true;

-- If you already inserted it, update the existing record to be public
UPDATE site_settings SET is_public = true WHERE key = 'support_chat_code';

