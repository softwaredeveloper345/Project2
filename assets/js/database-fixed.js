// Simple Database Service - Fixed Version with Supabase
class DatabaseService {
    constructor() {
        // Supabase configuration - Gerçek bilgileri buraya girin
        this.supabaseUrl = 'https://xgdxqnpsmkbnamtsjhmo.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHhxbnBzbWtibmFtdHNqaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEzNTIsImV4cCI6MjA3NDEyNzM1Mn0.P31ThhfVKP-hreXJOlezqnzYYQBygm4yituo7WyO2JM';
        this.supabase = null;
        this.isDemoMode = false; // NO DEMO MODE - SUPABASE ONLY
        this.isSupabaseReady = false;
        this.connectionError = null; // Store connection error
        
        console.log('🚀 Database service starting (SUPABASE ONLY MODE)...');
        console.log('🌐 Supabase URL:', this.supabaseUrl);
        console.log('🔑 API Key length:', this.supabaseKey.length);
        
        // Clear all localStorage data immediately
        this.clearAllLocalStorage();
        
        // Initialize Supabase (required) - Don't throw errors in constructor
        console.log('⚡ Supabase initialization başlatılıyor...');
        this.initSupabase()
            .then(() => {
                console.log('🎉 Supabase initialization tamamlandı!');
            })
            .catch(error => {
                console.error('❌ CRITICAL: Supabase initialization failed:', error);
                this.connectionError = error;
                this.isDemoMode = false; // Still no demo mode
                this.isSupabaseReady = false;
            });
    }

    clearAllLocalStorage() {
        console.log('🧹 Tüm localStorage verileri temizleniyor...');
        const keysToRemove = [
            'mockUsers',
            'mockActivities', 
            'currentUser',
            'users',
            'activities',
            'userData',
            'userProfiles',
            'demoUsers'
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`✅ ${key} silindi`);
            }
        });
        
        console.log('✅ LocalStorage tamamen temizlendi!');
    }
    
    async initSupabase() {
        try {
            console.log('🔌 Supabase bağlantısı kuruluyor...');
            console.log('🌐 URL test ediliyor:', this.supabaseUrl);
            
            // Skip health check - it might not be available or require auth
            // try {
            //     const healthCheck = await fetch(`${this.supabaseUrl}/health`, {
            //         method: 'GET',
            //         headers: { 'Content-Type': 'application/json' }
            //     });
            //     console.log('🏥 Health check response:', healthCheck.status);
            // } catch (fetchError) {
            //     console.log('⚠️ Health check failed:', fetchError.message);
            //     // Continue anyway, health endpoint might not exist
            // }
            
            console.log('⏭️ Health check atlanıyor, direkt client oluşturuluyor...');
            
            // Load Supabase library if not already loaded
            if (typeof window !== 'undefined' && !window.supabase) {
                console.log('📦 Supabase library yükleniyor...');
                await this.loadSupabaseLibrary();
                // Wait a bit for library to initialize
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('⏳ Library initialization tamamlandı');
            } else {
                console.log('✅ Supabase library zaten mevcut');
            }
            
            if (!window.supabase) {
                console.error('❌ window.supabase hala undefined!');
                throw new Error('Supabase library yüklenemedi - CDN problemi olabilir');
            }
            
            console.log('✅ Supabase library confirmed loaded');
            console.log('🔗 Supabase client oluşturuluyor...');
            
            // Create client with more permissive settings
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            });
            
            console.log('🧪 Supabase bağlantısı test ediliyor...');
            
            // Test with a simple query - use .maybeSingle() to avoid errors if no data
            const { data, error, status } = await this.supabase
                .from('users')
                .select('id, username')
                .limit(1);
            
            console.log('📊 Query response - Status:', status, 'Error:', error, 'Data:', data);
            
            if (error) {
                console.error('❌ Supabase test hatası:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    hint: error.hint,
                    details: error.details
                });
                
                if (error.message.includes('relation "users" does not exist') || 
                    error.code === 'PGRST116' || error.code === '42P01') {
                    console.log('📋 Users tablosu bulunamadı');
                    console.log('📄 Çözüm: supabase-setup.sql dosyasını Supabase Dashboard\'da çalıştırın');
                } else if (error.code === 'PGRST301') {
                    console.log('🔒 RLS (Row Level Security) problemi');
                } else if (error.message.includes('JWT') || error.code === '401') {
                    console.log('🔑 API Key geçersiz veya süresi dolmuş');
                    console.log('💡 Yeni API Key al: Supabase Dashboard > Settings > API');
                } else {
                    console.log('🔄 Bilinmeyen Supabase hatası');
                }
                
                this.isDemoMode = true;
                this.isSupabaseReady = false;
            } else {
                console.log('✅ Supabase başarıyla bağlandı!');
                console.log(`📊 ${data?.length || 0} kullanıcı bulundu`);
                this.isSupabaseReady = true;
                this.isDemoMode = false;
                
                // Dispatch ready event
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('databaseReady', { 
                        detail: { 
                            database: this,
                            usersCount: data?.length || 0 
                        } 
                    }));
                    console.log('📡 Database ready event dispatched');
                }
            }
            
        } catch (error) {
            console.error('❌ Supabase bağlantı genel hatası:', error);
            console.error('Stack:', error.stack);
            this.isDemoMode = true;
            this.isSupabaseReady = false;
        }
    }
    
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.supabase) {
                console.log('📦 Supabase library already loaded');
                resolve();
                return;
            }
            
            console.log('🌐 Supabase library CDN\'den yükleniyor...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => {
                console.log('✅ Supabase library script loaded successfully');
                // Give it a moment to initialize
                setTimeout(() => {
                    if (window.supabase) {
                        console.log('🎉 window.supabase available!');
                        resolve();
                    } else {
                        console.error('❌ Script loaded but window.supabase still undefined');
                        reject(new Error('Supabase library script loaded but not available'));
                    }
                }, 500);
            };
            script.onerror = (error) => {
                console.error('❌ Supabase library CDN yüklenemedi:', error);
                reject(new Error('Failed to load Supabase library from CDN'));
            };
            
            // Add to document head
            document.head.appendChild(script);
            console.log('📋 Supabase script tag added to document head');
            
            // Timeout after 15 seconds
            setTimeout(() => {
                if (!window.supabase) {
                    console.error('⏰ Supabase library loading timeout!');
                    reject(new Error('Supabase library loading timeout (15s)'));
                }
            }, 15000);
        });
    }

    async createTablesIfNotExist() {
        try {
            console.log('📋 Otomatik tablo oluşturma deneniyor...');
            
            const createUserTableSQL = `
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    first_name VARCHAR(50),
                    last_name VARCHAR(50),
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
                    status VARCHAR(20) DEFAULT 'suspended' CHECK (status IN ('active', 'inactive', 'suspended')),
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
                
                INSERT INTO users (username, email, password, first_name, last_name, role, gender, terms_accepted, terms_accepted_at)
                VALUES ('admin', 'admin@example.com', 'admin123', 'Admin', 'User', 'admin', 'male', true, NOW())
                ON CONFLICT (username) DO NOTHING;
            `;
            
            const { data, error } = await this.supabase.rpc('exec_sql', { 
                sql: createUserTableSQL 
            });
            
            if (error) {
                console.error('❌ Otomatik tablo oluşturulamadı:', error);
            } else {
                console.log('✅ Tablolar otomatik oluşturuldu');
            }
            
        } catch (error) {
            console.error('❌ Tablo oluşturma hatası:', error);
        }
    }
    
    async getAllUsers(includeStatusFilter = false, currentUserRole = null) {
        console.log('📊 Getting all users (SUPABASE ONLY)...', { includeStatusFilter, currentUserRole });
        
        if (this.connectionError) {
            console.error('❌ Supabase bağlantı hatası:', this.connectionError.message);
            // Return empty array instead of throwing error
            console.log('🔄 Boş kullanıcı listesi döndürülüyor...');
            return [];
        }
        
        if (!this.supabase) {
            console.error('❌ Supabase client mevcut değil!');
            // Wait a bit for initialization
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (!this.supabase) {
                console.log('🔄 Supabase hazır değil, boş liste döndürülüyor...');
                return [];
            }
        }
        
        try {
            console.log('🔗 Supabase\'den kullanıcılar getiriliyor...');
            
            let query = this.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Admin olmayan kullanıcılar için askıda olan profilleri gizle
            if (includeStatusFilter && currentUserRole !== 'admin') {
                console.log('👤 Admin olmayan kullanıcı - askıda olan profiller filtreleniyor...');
                query = query.in('status', ['active', 'inactive']);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('❌ Supabase getAllUsers hatası:', error);
                console.log('🔄 Hata nedeniyle boş liste döndürülüyor...');
                this.isSupabaseReady = false;
                return [];
            }
            
            let filteredData = data || [];
            
            // Frontend'de ek filtreleme (backend filtrelemeyi desteklemeyen durumlar için)
            if (includeStatusFilter && currentUserRole !== 'admin') {
                filteredData = filteredData.filter(user => user.status !== 'suspended');
                console.log(`🔒 ${(data?.length || 0) - filteredData.length} askıda kullanıcı gizlendi`);
            }
            
            console.log(`✅ ${filteredData.length} kullanıcı Supabase'den getirildi (toplam: ${data?.length || 0})`);
            this.isSupabaseReady = true;
            return filteredData;
            
        } catch (supabaseError) {
            console.error('❌ Supabase getAllUsers exception:', supabaseError);
            console.log('🔄 Exception nedeniyle boş liste döndürülüyor...');
            this.isSupabaseReady = false;
            return [];
        }
    }
    
    // Sadece aktif kullanıcıları getir (askıda ve pasif olanları hariç tut)
    async getActiveUsers() {
        console.log('👥 Getting active users only...');
        
        try {
            const allUsers = await this.getAllUsers(true, 'user'); // Admin olmayan kullanıcı gibi davran
            return allUsers.filter(user => user.status === 'active');
        } catch (error) {
            console.error('❌ getActiveUsers error:', error);
            return [];
        }
    }
    
    // Visible users - admin görebilir hepsini, diğerleri sadece aktif ve pasif olanları
    async getVisibleUsers(currentUserRole = 'user', currentUserStatus = 'active') {
        console.log('👁️ Getting visible users for role:', currentUserRole, 'status:', currentUserStatus);
        
        // SUSPENDED kullanıcılar hiçbir profil göremez
        if (currentUserStatus === 'suspended') {
            console.log('🚫 SUSPENDED kullanıcı - hiçbir profil gösterilmiyor');
            return [];
        }
        
        try {
            return await this.getAllUsers(true, currentUserRole);
        } catch (error) {
            console.error('❌ getVisibleUsers error:', error);
            return [];
        }
    }
    
    getLocalStorageUsers() {
        console.log('📂 localStorage\'dan kullanıcılar getiriliyor...');
        const users = localStorage.getItem('mockUsers');
        const parsed = users ? JSON.parse(users) : [];
        console.log('� localStorage users found:', parsed.length);
        
        // NO MOCK DATA CREATION - SUPABASE ONLY
        return [];
        
        return parsed;
    }
    
    async getUserById(userId) {
        const users = await this.getAllUsers();
        return users.find(u => u.id == userId);
    }
    
    async createUser(userData) {
        console.log('📝 Creating user:', userData.username);
        console.log('🔍 Supabase durumu - Ready:', this.isSupabaseReady, 'Demo:', this.isDemoMode, 'Client:', !!this.supabase);
        console.log('🔗 Supabase URL:', this.supabaseUrl);
        console.log('🗝️ API Key mevcut:', this.supabaseKey ? 'Evet (ilk 20: ' + this.supabaseKey.substring(0, 20) + '...)' : 'Hayır');
        
        // Force re-test Supabase connection before creating user
        if (this.supabase && this.isDemoMode) {
            console.log('🔄 Supabase durumu yeniden test ediliyor...');
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('id')
                    .limit(1);
                
                if (!error) {
                    console.log('✅ Supabase çalışıyor! Demo modundan çıkılıyor...');
                    this.isSupabaseReady = true;
                    this.isDemoMode = false;
                } else {
                    console.log('❌ Supabase hala çalışmıyor:', error.message);
                    console.log('🔍 Error details:', {
                        code: error.code,
                        hint: error.hint,
                        details: error.details
                    });
                }
            } catch (testError) {
                console.log('❌ Supabase test hatası:', testError.message);
            }
        }
        
        // Recreate client with proper auth headers to fix 401 issue
        if (this.supabase && this.supabaseUrl && this.supabaseKey) {
            console.log('🔧 Supabase client yeniden oluşturuluyor (401 fix)...');
            try {
                this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    },
                    global: {
                        headers: {
                            'apikey': this.supabaseKey,
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        }
                    },
                    db: {
                        schema: 'public'
                    }
                });
                console.log('✅ Supabase client yenilendi');
            } catch (clientError) {
                console.error('❌ Client yenileme hatası:', clientError);
            }
        }
        
        // Try Supabase first if client exists
        if (this.supabase) {
            try {
                console.log('🔗 Supabase ile kullanıcı eklemeye çalışılıyor...');
                
                // Check if user exists in Supabase
                const { data: existingUsers, error: checkError } = await this.supabase
                    .from('users')
                    .select('id, username, email')
                    .or(`username.eq.${userData.username},email.eq.${userData.email}`);
                
                if (checkError) {
                    console.error('❌ Supabase existence check failed:', checkError.message, checkError.code);
                    console.error('❌ Error details:', {
                        hint: checkError.hint,
                        details: checkError.details
                    });
                    throw checkError;
                }
                
                if (existingUsers && existingUsers.length > 0) {
                    console.log('⚠️ User already exists in Supabase:', existingUsers[0]);
                    return { 
                        success: false, 
                        message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor! (Supabase)' 
                    };
                }
                
                console.log('✅ User doesn\'t exist, creating in Supabase...');
                console.log('🔍 userData.status before insert:', userData.status); // DEBUG
                
                // FORCE status to be suspended for new users
                const finalStatus = 'suspended'; // Zorla suspended yap
                console.log('🔒 Final status set to:', finalStatus); // DEBUG
                
                // Create user in Supabase
                const { data, error } = await this.supabase
                    .from('users')
                    .insert([{
                        username: userData.username,
                        email: userData.email,
                        password: userData.password,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        role: userData.role || 'user',
                        status: finalStatus, // Zorla suspended kullan
                        gender: userData.gender,
                        phone: userData.phone,
                        reference: userData.reference,
                        bio: userData.bio,
                        terms_accepted: userData.terms_accepted || false,
                        terms_accepted_at: userData.terms_accepted_at || new Date().toISOString(),
                        created_at: new Date().toISOString()
                        // removed updated_at - not in Supabase table schema
                    }])
                    .select()
                    .single();
                
                console.log('🔍 Eklenen kullanıcı data:', data); // DEBUG: Eklenen kullanıcının status'ünü kontrol et
                
                if (error) {
                    console.error('❌ Supabase insert error:', error.message, error.code, error.hint);
                    console.error('❌ Insert error details:', {
                        details: error.details,
                        status: error.status
                    });
                    throw error;
                }
                
                console.log('🎉 Kullanıcı Supabase\'e başarıyla eklendi!', data);
                
                // Update status flags
                this.isSupabaseReady = true;
                this.isDemoMode = false;
                
                // No localStorage backup - Supabase only
                
                return { success: true, user: data, source: 'supabase' };
                
            } catch (error) {
                console.error('❌ Supabase createUser exception:', error.message);
                console.log('🔄 Falling back to localStorage...');
                
                // If it's RLS error, inform user
                if (error.message && error.message.includes('row-level security')) {
                    return {
                        success: false,
                        message: 'Supabase RLS sorunu! Config sayfasından RLS düzeltme kodunu çalıştırın.'
                    };
                }
                
                // If it's 401 error, inform user about API key issue
                if (error.code === '401' || error.message.includes('401') || error.message.includes('Unauthorized')) {
                    return {
                        success: false,
                        message: 'Supabase API Key hatası! Config sayfasından yeni API Key giriniz.'
                    };
                }
            }
        } else {
            throw new Error('Veritabanı bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.');
        }
    }
    
    async updateUser(userId, updates) {
        if (!this.supabase) {
            throw new Error('Veritabanı bağlantısı hazır değil. Lütfen bekleyip tekrar deneyin.');
        }
        
        try {
            console.log('🔄 Kullanıcı güncelleniyor (Supabase):', userId);
            
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Supabase update hatası:', error);
                throw error;
            }
            
            console.log('✅ Kullanıcı güncellendi:', data);
            return { success: true, user: data };
            
        } catch (error) {
            console.error('❌ updateUser hatası:', error);
            return { success: false, error: error.message };
        }
    }
    
    async deleteUser(userId) {
        if (!this.supabase) {
            throw new Error('Veritabanı bağlantısı hazır değil. Lütfen bekleyip tekrar deneyin.');
        }
        
        try {
            console.log('🗑️ Kullanıcı siliniyor (Supabase):', userId);
            
            const { error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (error) {
                console.error('❌ Supabase delete hatası:', error);
                throw error;
            }
            
            console.log('✅ Kullanıcı silindi');
            return { success: true };
            
        } catch (error) {
            console.error('❌ deleteUser hatası:', error);
            return { success: false, error: error.message };
        }
    }
    
    async logActivity(userId, action, description) {
        console.log('📝 logActivity çağrıldı:', { userId, action, description });
        
        // Only use Supabase for activities - no localStorage fallback
        if (!this.supabase) {
            console.warn('⚠️ Supabase client yok, activity loglanamadı');
            return null;
        }
        
        try {
            // Test activities table first
            const { data: testData, error: testError } = await this.supabase
                .from('activities')
                .select('id')
                .limit(1);

            if (testError && testError.code === 'PGRST116') {
                console.error('❌ Activities tablosu bulunamadı, activity loglanamadı');
                console.log('💡 Çözüm: supabase-setup.sql dosyasını çalıştırın');
                return null;
            }

            const newActivity = {
                user_id: userId,
                action: action,
                description: description,
                ip_address: '127.0.0.1',
                created_at: new Date().toISOString()
            };
            
            console.log('📝 Activity Supabase\'e ekleniyor:', newActivity);
            
            const { data, error } = await this.supabase
                .from('activities')
                .insert([newActivity])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Activity log hatası:', error);
                return null;
            }
            
            console.log('✅ Activity logged:', data);
            return data;
            
        } catch (error) {
            console.error('❌ logActivity hatası:', error);
            return null;
        }
    }
    
    async getActivities(limit = 50) {
        console.log('📋 getActivities çağrıldı - Supabase durumu:', {
            hasSupabase: !!this.supabase,
            isReady: this.isSupabaseReady,
            isDemoMode: this.isDemoMode,
            connectionError: this.connectionError?.message
        });

        if (!this.supabase) {
            console.warn('⚠️ Supabase client yok, boş liste döndürülüyor...');
            return [];
        }

        // Test Supabase connection and activities table
        try {
            console.log('🧪 Activities tablosu varlığı test ediliyor...');
            const { data: testData, error: testError } = await this.supabase
                .from('activities')
                .select('id')
                .limit(1);

            if (testError) {
                console.error('❌ Activities tablosu test hatası:', testError);
                if (testError.message.includes('relation "activities" does not exist') || 
                    testError.code === 'PGRST116') {
                    console.log('📋 Activities tablosu bulunamadı!');
                    console.log('💡 Çözüm: supabase-setup.sql dosyasını Supabase Dashboard\'da çalıştırın');
                }
                return [];
            }

            console.log('✅ Activities tablosu mevcut, veriler getiriliyor...');
        } catch (testException) {
            console.error('❌ Activities tablo testi exception:', testException);
            return [];
        }
        
        try {
            console.log('📋 Activities getiriliyor (Supabase)...');
            
            const { data, error } = await this.supabase
                .from('activities')
                .select(`
                    *,
                    users!activities_user_id_fkey (
                        first_name,
                        last_name,
                        username
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('❌ Activities query hatası:', error);
                return [];
            }
            
            // Format data for compatibility
            const activitiesWithUsers = data.map(activity => ({
                ...activity,
                first_name: activity.users?.first_name || 'Unknown',
                last_name: activity.users?.last_name || 'User',
                username: activity.users?.username || 'unknown'
            }));
            
            console.log('📋 Activities bulundu:', activitiesWithUsers.length);
            return activitiesWithUsers;
            
        } catch (error) {
            console.error('❌ getActivities hatası:', error);
            return [];
        }
    }
    
    getStatusMessage() {
        // Always return success status - no annoying connection messages
        return {
            type: 'success',
            icon: '✅',
            title: 'Hayırlı günler dileriz',
            message: 'Bismillahirrahmanirrahim',
            action: null
        };
    }
}

// Global database instance
console.log('📦 DatabaseService instance oluşturuluyor...');
const db = new DatabaseService();

// Export for use in other files
window.DatabaseService = DatabaseService;
window.db = db;

// Add event listener for when database is ready
window.onDatabaseReady = function(callback) {
    if (db.isSupabaseReady && db.supabase) {
        callback();
    } else {
        // Check every 500ms until database is ready
        const checkInterval = setInterval(() => {
            if (db.isSupabaseReady && db.supabase) {
                clearInterval(checkInterval);
                callback();
            }
        }, 500);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Database ready timeout!');
        }, 30000);
    }
};

console.log('🚀 Database service initialized - Global instance ready');