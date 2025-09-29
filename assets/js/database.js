// Supabase Database Configuration
// Replace localStorage with real database

class DatabaseService {
    constructor() {
        // Supabase configuration - Bu bilgileri Supabase dashboard'dan alın
        this.supabaseUrl = 'https://xgdxqnpsmkbnamtsjhmo.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHhxbnBzbWtibmFtdHNqaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTEzNTIsImV4cCI6MjA3NDEyNzM1Mn0.P31ThhfVKP-hreXJOlezqnzYYQBygm4yituo7WyO2JM';
        this.supabase = null;
        
        // Production mode - Force Supabase usage
        this.isDemoMode = false; // Demo modu kapatıldı
        this.isSupabaseReady = false;
        
        // Initialize localStorage data immediately for fallback
        this.ensureMockData();
        
        this.initSupabase();
    }
    
    // Ensure mock data exists
    ensureMockData() {
        if (!localStorage.getItem('mockUsers')) {
            console.log('🔧 Mock data yok, oluşturuluyor...');
            this.initializeMockDataFallback();
        } else {
            console.log('✅ Mock data zaten mevcut');
        }
    }
    
    async initSupabase() {
        try {
            console.log('🔌 Supabase bağlantısı kuruluyor...');
            
            // CDN'den Supabase client'ı yükle
            if (!window.supabase) {
                console.log('📦 Supabase library yükleniyor...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                document.head.appendChild(script);
                
                await new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log('✅ Supabase library yüklendi');
                        resolve();
                    };
                    script.onerror = reject;
                    setTimeout(reject, 10000); // 10 saniye timeout
                });
                
                // Library yüklenene kadar bekle
                let attempts = 0;
                while (!window.supabase && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.supabase) {
                    throw new Error('Supabase library yüklenemedi');
                }
            }
            
            // Supabase client oluştur
            console.log('🔗 Supabase client oluşturuluyor...');
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            
            if (!this.supabase) {
                throw new Error('Supabase client oluşturulamadı');
            }
            
            // Bağlantıyı test et
            console.log('🧪 Supabase bağlantısı test ediliyor...');
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('❌ Supabase tablolar bulunamadı:', error.message);
                console.log('📋 Lütfen supabase-setup.sql dosyasını Supabase Dashboard\'da çalıştırın');
                this.isDemoMode = true;
                return;
            }
            
            console.log('✅ Supabase başarıyla bağlandı');
            this.isSupabaseReady = true;
            this.isDemoMode = false;
            
            // Trigger ready callbacks
            setTimeout(() => {
                if (window.triggerDatabaseReady) {
                    window.triggerDatabaseReady();
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Supabase bağlantı hatası:', error);
            console.log('🎯 Demo moduna geçiliyor...');
            this.isDemoMode = true;
        }
    }
    
    // User management methods
    async getAllUsers() {
        if (this.isDemoMode || !this.supabase) {
            console.log('🎯 Demo mode: localStorage kullanılıyor');
            return this.getLocalStorageUsers();
        }
        
        try {
            console.log('📊 Supabase\'den kullanıcılar getiriliyor...');
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('❌ Kullanıcı listesi alınamadı:', error);
                throw error;
            }
            
            console.log(`✅ ${data?.length || 0} kullanıcı bulundu`);
            return data || [];
        } catch (error) {
            console.error('❌ Supabase hatası, localStorage\'a geçiliyor:', error);
            return this.getLocalStorageUsers();
        }
    }
    
    async getUserById(userId) {
        if (this.isDemoMode) {
            return this.getLocalStorageUsers().find(u => u.id === userId);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user:', error);
            return this.getLocalStorageUsers().find(u => u.id === userId);
        }
    }
    
    async createUser(userData) {
        if (this.isDemoMode) {
            console.log('🎯 Demo mode: localStorage kullanarak kullanıcı oluşturuluyor');
            return this.createLocalStorageUser(userData);
        }
        
        try {
            console.log('📝 Supabase\'e kullanıcı ekleniyor:', userData);
            
            // Hash password if not already hashed
            if (userData.password && !userData.password.startsWith('$')) {
                // In real app, use proper hashing
                userData.password = btoa(userData.password); // Simple base64 for demo
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .insert([userData])
                .select()
                .single();
                
            if (error) {
                console.error('❌ Supabase insert error:', error);
                throw error;
            }
            
            console.log('✅ Kullanıcı Supabase\'e eklendi:', data);
            return { success: true, user: data };
        } catch (error) {
            console.error('❌ Error creating user in Supabase:', error);
            console.log('🔄 localStorage\'a geri döner');
            return this.createLocalStorageUser(userData);
        }
    }
    
    async updateUser(userId, updates) {
        if (this.isDemoMode) {
            return this.updateLocalStorageUser(userId, updates);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, user: data };
        } catch (error) {
            console.error('Error updating user:', error);
            return this.updateLocalStorageUser(userId, updates);
        }
    }
    
    async deleteUser(userId) {
        if (this.isDemoMode) {
            return this.deleteLocalStorageUser(userId);
        }
        
        try {
            const { error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);
                
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return this.deleteLocalStorageUser(userId);
        }
    }
    
    // Activity logging
    async logActivity(userId, action, description) {
        const activity = {
            user_id: userId,
            action: action,
            description: description,
            ip_address: '127.0.0.1', // In real app, get from request
            created_at: new Date().toISOString()
        };
        
        if (this.isDemoMode) {
            return this.logLocalStorageActivity(activity);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('activities')
                .insert([activity])
                .select()
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error logging activity:', error);
            return this.logLocalStorageActivity(activity);
        }
    }
    
    async getActivities(limit = 50) {
        if (this.isDemoMode) {
            return this.getLocalStorageActivities(limit);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('activities')
                .select(`
                    *,
                    users (
                        first_name,
                        last_name,
                        username
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) throw error;
            
            // Eğer aktivite yoksa demo data oluştur
            if (!data || data.length === 0) {
                console.log('📝 Aktivite bulunamadı, demo data oluşturuluyor...');
                await this.createDemoActivities();
                
                // Tekrar dene
                const { data: newData, error: newError } = await this.supabase
                    .from('activities')
                    .select(`
                        *,
                        users (
                            first_name,
                            last_name,
                            username
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                    
                if (newError) throw newError;
                
                // Data formatting for compatibility
                const formattedData = newData.map(activity => ({
                    ...activity,
                    first_name: activity.users?.first_name || 'Unknown',
                    last_name: activity.users?.last_name || 'User',
                    username: activity.users?.username || 'unknown'
                }));
                
                return formattedData;
            }
            
            // Data formatting for compatibility
            const formattedData = data.map(activity => ({
                ...activity,
                first_name: activity.users?.first_name || 'Unknown',
                last_name: activity.users?.last_name || 'User',
                username: activity.users?.username || 'unknown'
            }));
            
            return formattedData;
        } catch (error) {
            console.error('Error fetching activities:', error);
            return this.getLocalStorageActivities(limit);
        }
    }
    
    // Demo aktiviteler oluştur
    async createDemoActivities() {
        try {
            // Kullanıcıları al
            const { data: users, error: usersError } = await this.supabase
                .from('users')
                .select('id, username');
                
            if (usersError || !users) {
                console.error('❌ Kullanıcılar bulunamadı:', usersError);
                return;
            }
            
            const john = users.find(u => u.username === 'john_doe');
            const jane = users.find(u => u.username === 'jane_smith');
            const admin = users.find(u => u.username === 'admin');
            
            const demoActivities = [];
            
            if (john) {
                demoActivities.push({
                    user_id: john.id,
                    action: 'login',
                    description: 'Sisteme giriş yapıldı',
                    ip_address: '192.168.1.100',
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 saat önce
                });
                demoActivities.push({
                    user_id: john.id,
                    action: 'profile_update',
                    description: 'Profil fotoğrafı güncellendi',
                    ip_address: '192.168.1.100',
                    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 dk önce
                });
            }
            
            if (jane) {
                demoActivities.push({
                    user_id: jane.id,
                    action: 'profile_update',
                    description: 'Profil bilgileri güncellendi',
                    ip_address: '192.168.1.101',
                    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 saat önce
                });
                demoActivities.push({
                    user_id: jane.id,
                    action: 'login',
                    description: 'Sisteme giriş yapıldı',
                    ip_address: '192.168.1.101',
                    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 dk önce
                });
            }
            
            if (admin) {
                demoActivities.push({
                    user_id: admin.id,
                    action: 'login',
                    description: 'Admin girişi',
                    ip_address: '192.168.1.1',
                    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 dk önce
                });
            }
            
            if (demoActivities.length > 0) {
                const { error } = await this.supabase
                    .from('activities')
                    .insert(demoActivities);
                    
                if (error) {
                    console.error('❌ Demo aktiviteler oluşturulamadı:', error);
                } else {
                    console.log(`✅ ${demoActivities.length} demo aktivite oluşturuldu`);
                }
            }
        } catch (error) {
            console.error('❌ Demo aktivite oluşturma hatası:', error);
        }
    }
    
    // localStorage fallback methods
    getLocalStorageUsers() {
        console.log('📂 localStorage\'dan kullanıcılar getiriliyor...');
        const users = localStorage.getItem('mockUsers');
        const parsed = users ? JSON.parse(users) : [];
        console.log('📂 localStorage users found:', parsed.length);
        
        // Eğer hiç kullanıcı yoksa, mock data'yı manuel olarak yükle
        if (parsed.length === 0) {
            console.log('⚠️ localStorage boş, mock data yükleniyor...');
            this.initializeMockDataFallback();
            const newUsers = localStorage.getItem('mockUsers');
            const newParsed = newUsers ? JSON.parse(newUsers) : [];
            console.log('📂 Yeni yüklenen users:', newParsed.length);
            return newParsed;
        }
        
        return parsed;
    }
    
    // Mock data fallback initialization
    initializeMockDataFallback() {
        const mockUsers = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
                status: 'active',
                created_at: '2024-01-01T00:00:00Z',
                last_login: null,
                bio: 'Sistem yöneticisi',
                phone: '+90 555 000 0001',
                gender: null,
                profile_image: null,
                secondary_image: null,
                terms_accepted: true,
                terms_accepted_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 2,
                username: 'john_doe',
                email: 'john@example.com',
                password: 'user123',
                first_name: 'John',
                last_name: 'Doe',
                role: 'user',
                status: 'active',
                created_at: '2024-01-15T00:00:00Z',
                last_login: null,
                bio: 'Demo kullanıcısı',
                phone: '+90 555 123 4567',
                gender: 'male',
                profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
                secondary_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                terms_accepted: true,
                terms_accepted_at: '2024-01-15T00:00:00Z'
            },
            {
                id: 3,
                username: 'jane_smith',
                email: 'jane@example.com',
                password: 'user123',
                first_name: 'Jane',
                last_name: 'Smith',
                role: 'user',
                status: 'active',
                created_at: '2024-01-20T00:00:00Z',
                last_login: null,
                bio: 'Demo kullanıcısı',
                phone: '+90 555 987 6543',
                gender: 'female',
                profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
                secondary_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
                terms_accepted: true,
                terms_accepted_at: '2024-01-20T00:00:00Z'
            }
        ];
        
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        console.log('✅ Mock users localStorage\'a yüklendi');
    }
    
    createLocalStorageUser(userData) {
        const users = this.getLocalStorageUsers();
        const newUser = {
            ...userData,
            id: Date.now(),
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(users));
        return { success: true, user: newUser };
    }
    
    updateLocalStorageUser(userId, updates) {
        const users = this.getLocalStorageUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('mockUsers', JSON.stringify(users));
            return { success: true, user: users[userIndex] };
        }
        return { success: false, error: 'User not found' };
    }
    
    deleteLocalStorageUser(userId) {
        const users = this.getLocalStorageUsers();
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('mockUsers', JSON.stringify(filteredUsers));
        return { success: true };
    }
    
    logLocalStorageActivity(activity) {
        const activities = this.getLocalStorageActivities();
        const newActivity = { ...activity, id: Date.now() };
        activities.unshift(newActivity);
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }
        localStorage.setItem('mockActivities', JSON.stringify(activities));
        return newActivity;
    }
    
    getLocalStorageActivities(limit = 50) {
        const activities = localStorage.getItem('mockActivities');
        const parsed = activities ? JSON.parse(activities) : [];
        
        // Add user info for activities
        const users = this.getLocalStorageUsers();
        return parsed.slice(0, limit).map(activity => {
            const user = users.find(u => u.id === activity.user_id);
            return {
                ...activity,
                first_name: user?.first_name || 'Unknown',
                last_name: user?.last_name || 'User',
                username: user?.username || 'unknown'
            };
        });
    }
    
    // Show appropriate status message
    getStatusMessage() {
        if (this.isDemoMode) {
            return {
                type: 'warning',
                icon: '🎯',
                title: 'Demo Modu',
                message: 'Bu statik demo versiyonudur. Gerçek veritabanı işlemleri simüle edilmektedir.',
                action: 'Gerçek veritabanı için Supabase yapılandırmasını tamamlayın.'
            };
        } else {
            return {
                type: 'success',
                icon: '✅',
                title: 'Canlı Veritabanı',
                message: 'Supabase veritabanına bağlanıldı. Tüm işlemler gerçek zamanlı olarak kaydediliyor.',
                action: null
            };
        }
    }
}

// Global database instance
const db = new DatabaseService();

// Database ready event system
let dbReadyCallbacks = [];
const onDatabaseReady = (callback) => {
    if (db.isSupabaseReady || db.isDemoMode) {
        setTimeout(callback, 0);
    } else {
        dbReadyCallbacks.push(callback);
    }
};

// Trigger callbacks when database is ready
const triggerDatabaseReady = () => {
    dbReadyCallbacks.forEach(callback => {
        try {
            callback();
        } catch (error) {
            console.error('❌ Database ready callback error:', error);
        }
    });
    dbReadyCallbacks = [];
};

// Export for use in other files
window.DatabaseService = DatabaseService;
window.db = db;
window.onDatabaseReady = onDatabaseReady;
window.triggerDatabaseReady = triggerDatabaseReady;

console.log('🚀 Database service initialized');