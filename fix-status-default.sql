-- Supabase'de mevcut tablodaki status default değerini değiştir
-- Bu SQL kodunu Supabase Dashboard > SQL Editor'de çalıştırın

-- Önce mevcut default constraint'i kaldır
ALTER TABLE users ALTER COLUMN status DROP DEFAULT;

-- Yeni default değeri 'suspended' olarak ayarla
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'suspended';

-- Kontrol et
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'status';

-- Sonuç: column_default = 'suspended'::character varying olmalı