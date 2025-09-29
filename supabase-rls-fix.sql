-- SUPABASE RLS FIX - User Management System
-- Bu SQL kodu RLS (Row Level Security) problemini çözer
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Önce tabloları oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    phone VARCHAR(20),
    bio TEXT,
    profile_image TEXT,
    secondary_image TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS'i KAPAT (en kolay çözüm)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Eğer activities tablosu varsa onu da kapat
CREATE TABLE IF NOT EXISTS user_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_activities DISABLE ROW LEVEL SECURITY;

-- 4. Test kullanıcıları ekle
INSERT INTO users (
    username, 
    email, 
    password, 
    first_name, 
    last_name, 
    role, 
    status, 
    gender,
    bio,
    phone,
    terms_accepted,
    terms_accepted_at
) VALUES 
(
    'admin',
    'admin@example.com',
    'admin123',
    'Admin',
    'User',
    'admin',
    'active',
    'male',
    'Sistem yöneticisi',
    '+90 555 000 0001',
    true,
    NOW()
),
(
    'john_doe',
    'john@example.com',
    'user123',
    'John',
    'Doe',
    'user',
    'active',
    'male',
    'Demo kullanıcısı',
    '+90 555 123 4567',
    true,
    NOW()
),
(
    'jane_smith',
    'jane@example.com',
    'user123',
    'Jane',
    'Smith',
    'user',
    'active',
    'female',
    'Demo kullanıcısı',
    '+90 555 987 6543',
    true,
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 5. Başarı mesajı
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE '✅ RLS Düzeltildi! Toplam kullanıcı sayısı: %', user_count;
    
    -- RLS durumunu kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ Users tablosu RLS KAPALI';
    ELSE
        RAISE NOTICE '⚠️ Users tablosu RLS AÇIK';
    END IF;
END $$;

-- 6. Test sorgusu
SELECT 
    'Test Query' as info,
    COUNT(*) as user_count,
    string_agg(username, ', ') as users
FROM users;