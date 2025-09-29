-- Supabase Database Setup for User Management System
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Users tablosu oluştur
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    bio TEXT,
    phone VARCHAR(20),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    profile_image TEXT,
    secondary_image TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 2. Activities tablosu oluştur
CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Users tablosu için updated_at trigger'ı
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Demo verilerini ekle (opsiyonel)
INSERT INTO users (username, email, password, first_name, last_name, role, status, bio, phone, gender, profile_image, secondary_image, terms_accepted, terms_accepted_at) VALUES
('admin', 'admin@example.com', 'admin123', 'Admin', 'User', 'admin', 'active', 'Sistem yöneticisi', '+90 555 000 0001', NULL, NULL, NULL, TRUE, NOW()),
('john_doe', 'john@example.com', 'user123', 'John', 'Doe', 'user', 'active', 'Demo kullanıcısı', '+90 555 123 4567', 'male', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', TRUE, NOW()),
('jane_smith', 'jane@example.com', 'user123', 'Jane', 'Smith', 'user', 'active', 'Demo kullanıcısı', '+90 555 987 6543', 'female', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', TRUE, NOW())
ON CONFLICT (username) DO NOTHING;

-- 6. Başlangıç aktivitelerini ekle
INSERT INTO activities (user_id, action, description, ip_address) VALUES
((SELECT id FROM users WHERE username = 'john_doe'), 'login', 'Sisteme giriş yapıldı', '192.168.1.100'),
((SELECT id FROM users WHERE username = 'jane_smith'), 'profile_update', 'Profil bilgileri güncellendi', '192.168.1.101')
ON CONFLICT DO NOTHING;

-- 7. Row Level Security (RLS) politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi profillerini görebilir (admin hariç)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::bigint AND role = 'admin'));

-- Kullanıcılar sadece kendi profillerini güncelleyebilir (admin hariç)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::bigint AND role = 'admin'));

-- Sadece admin kullanıcı oluşturabilir (veya kayıt işlemi için genel erişim)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- Admin tüm aktiviteleri, kullanıcılar sadece kendi aktivitelerini görebilir
CREATE POLICY "View activities policy" ON activities
    FOR SELECT USING (user_id = auth.uid()::bigint OR 
                     EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::bigint AND role = 'admin'));

-- Aktivite ekleme için policy
CREATE POLICY "Insert activities policy" ON activities
    FOR INSERT WITH CHECK (true);

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Başarı mesajı
SELECT 'Supabase database setup completed successfully!' as message;