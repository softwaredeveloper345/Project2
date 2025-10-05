// Authentication management for static HTML version
// Using database.js for data management
// NO MOCK DATA - SUPABASE ONLY

// NO MOCK DATA INITIALIZATION - SUPABASE ONLY

// Get all users using database service
async function getAllUsers() {
    return await db.getAllUsers();
}

// Get all users with role-based filtering (suspended users hidden from non-admins)
async function getAllUsersFiltered(currentUserRole = 'user') {
    return await db.getAllUsers(true, currentUserRole);
}

// Get only active users (for user dashboards, photo galleries, etc.)
async function getActiveUsers() {
    return await db.getActiveUsers();
}

// Get visible users based on current user role
async function getVisibleUsers(currentUserRole = 'user') {
    return await db.getVisibleUsers(currentUserRole);
}

// Get user by ID using database service
async function getUserById(userId) {
    return await db.getUserById(userId);
}

// Get current user
function getCurrentUser() {
    // Get user from session storage only (no localStorage)
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return null;
    
    try {
        const sessionUser = JSON.parse(userStr);
        return sessionUser;
    } catch (parseError) {
        console.error('❌ Session parse error:', parseError);
        sessionStorage.removeItem('currentUser');
        return null;
    }
}

// Get fresh user data from database
async function getFreshUserData(userId) {
    if (window.db && window.db.supabase) {
        try {
            const { data, error } = await window.db.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (!error && data) {
                // Update session with fresh data
                sessionStorage.setItem('currentUser', JSON.stringify(data));
                return data;
            }
        } catch (supabaseError) {
            console.warn('⚠️ Fresh user data alınamadı:', supabaseError);
        }
    }
    return null;
}

// Login function
async function login(username, password) {
    try {
        console.log('🔐 Giriş işlemi başlıyor:', username);
        
        // Database hazır olana kadar bekle
        if (!db.isDemoMode && !db.isSupabaseReady) {
            console.log('⏳ Database bağlantısı bekleniyor...');
            
            // 5 saniye bekle database için
            let attempts = 0;
            while (!db.isSupabaseReady && !db.isDemoMode && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        const users = await db.getAllUsers();
        console.log('👥 Kullanıcılar alındı:', users?.length || 0);
        
        if (!Array.isArray(users)) {
            console.error('❌ Users data geçersiz:', users);
            return { success: false, message: 'Sistemde bir hata oluştu!' };
        }
        
        const user = users.find(u => u.username === username && u.password === password);
        console.log('🔍 Kullanıcı bulundu:', !!user);

        if (user) {
            console.log('✅ Giriş başarılı:', user.username);
            
            // Update last login
            await db.updateUser(user.id, { last_login: new Date().toISOString() });
            
            // Log activity
            await db.logActivity(user.id, 'login', 'Sisteme giriş yapıldı');

            // Store current user in session (not localStorage)
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            // Clear any old localStorage data
            localStorage.removeItem('currentUser');

            return { success: true, user: user };
        }

        console.log('❌ Kullanıcı adı veya şifre hatalı');
        return { success: false, message: 'Kullanıcı adı veya şifre hatalı!' };
    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, message: 'Giriş yapılırken bir hata oluştu!' };
    }
}

// Register function - UPDATED TO USE DATABASE.JS
async function register(userData) {
    try {
        console.log('📝 Register işlemi başlıyor:', userData);
        
        // Check if username or email already exists
        let existingUsers = [];
        try {
            existingUsers = await db.getAllUsers();
        } catch (dbError) {
            console.warn('⚠️ Database kullanıcıları alınamadı:', dbError.message);
            // Continue with user creation, let database handle duplicate check
        }
        
        if (Array.isArray(existingUsers)) {
            const existingUser = existingUsers.find(u => 
                u.username === userData.username || u.email === userData.email
            );
            
            if (existingUser) {
                return { 
                    success: false, 
                    message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor!' 
                };
            }
        }

        // Create new user data
        const newUserData = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: 'user',
            status: 'suspended', // Yeni kullanıcılar askıda başlar
            bio: '',
            phone: userData.phone || '',
            reference: userData.reference || '',
            gender: userData.gender || null,
            profile_image: null,
            secondary_image: null,
            terms_accepted: userData.terms_accepted || false,
            terms_accepted_at: userData.terms_accepted ? new Date().toISOString() : null
        };

        console.log('📝 Database.js ile kullanıcı oluşturuluyor:', newUserData);
        console.log('🔍 Status kontrol:', newUserData.status); // DEBUG: Status'ü kontrol et

        // Use database service to create user
        const result = await db.createUser(newUserData);
        
        if (result.success) {
            console.log('✅ Kullanıcı başarıyla oluşturuldu:', result.user);
            
            // Log activity
            await db.logActivity(result.user.id, 'register', 'Yeni kullanıcı kaydı oluşturuldu');
            return { success: true, user: result.user };
        } else {
            console.error('❌ Kullanıcı oluşturulamadı:', result);
            return { success: false, message: 'Kullanıcı oluşturulamadı' };
        }
        
    } catch (error) {
        console.error('❌ Register error:', error);
        return { success: false, message: 'Bir hata oluştu. Tekrar deneyin.' };
    }
}

// Update user profile
async function updateProfile(userId, updateData) {
    try {
        const result = await db.updateUser(userId, updateData);
        
        if (result.success) {
            // Log activity
            await db.logActivity(userId, 'profile_update', 'Profil bilgileri güncellendi');
            
            // Update current user if it's the same user
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
            }
            
            return result;
        } else {
            return { success: false, message: 'Profil güncellenemedi' };
        }
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: 'Profil güncellenirken bir hata oluştu' };
    }
}

// Get all activities
async function getAllActivities(limit = 50) {
    return await db.getActivities(limit);
}

// Get user specific activities
async function getUserActivities(userId, limit = 20) {
    console.log('📋 getUserActivities çağrıldı:', { userId, limit });
    console.log('📡 Database durumu:', {
        hasDB: !!window.db,
        hasSupabase: !!(window.db && window.db.supabase),
        isReady: window.db?.isSupabaseReady
    });
    
    try {
        const allActivities = await db.getActivities(100); // Get more to filter
        const userActivities = allActivities
            .filter(activity => activity.user_id == userId)
            .slice(0, limit);
            
        console.log('✅ getUserActivities sonuç:', userActivities.length, 'aktivite bulundu');
        return userActivities;
    } catch (error) {
        console.error('❌ getUserActivities error:', error);
        return [];
    }
}

// Log activity
async function logActivity(userId, action, description) {
    return await db.logActivity(userId, action, description);
}

// Update user (admin function)
async function updateUser(userId, updateData) {
    try {
        console.log('🔄 Kullanıcı güncelleniyor:', { userId, updateData });
        
        const result = await db.updateUser(userId, updateData);
        
        if (result.success) {
            console.log('✅ Kullanıcı başarıyla güncellendi:', result);
            return result;
        } else {
            console.error('❌ Kullanıcı güncelleme başarısız:', result);
            return { success: false, error: result.error || 'Güncelleme başarısız' };
        }
    } catch (error) {
        console.error('❌ updateUser exception:', error);
        return { success: false, error: error.message };
    }
}

// Delete user (admin function)
async function deleteUser(userId) {
    try {
        console.log('🗑️ Kullanıcı siliniyor:', userId);
        
        const result = await db.deleteUser(userId);
        
        if (result.success) {
            console.log('✅ Kullanıcı başarıyla silindi');
            return result;
        } else {
            console.error('❌ Kullanıcı silme başarısız:', result);
            return { success: false, error: result.error || 'Silme başarısız' };
        }
    } catch (error) {
        console.error('❌ deleteUser exception:', error);
        return { success: false, error: error.message };
    }
}

// Logout function
async function logout() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Log activity
        try {
            await db.logActivity(currentUser.id, 'logout', 'Sistemden çıkış yapıldı');
        } catch (error) {
            console.warn('⚠️ Logout activity log failed:', error);
        }
    }
    // Clear all user data from both storages
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    console.log('✅ Kullanıcı çıkış yaptı');
}

// Check if user is admin
function isAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.role === 'admin';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Initialize on load - NO MOCK DATA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Auth system başlatılıyor (SUPABASE ONLY)...');
    
    // Clear any existing localStorage mock data
    const keysToRemove = ['mockUsers', 'mockActivities', 'users', 'activities'];
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`🧹 ${key} localStorage'dan temizlendi`);
        }
    });
    
    // Database ready callback
    if (window.onDatabaseReady) {
        window.onDatabaseReady(() => {
            console.log('🔧 Auth system database bağlantısı hazır');
        });
    }
    
    console.log('🔧 Auth system initialized (NO LOCAL STORAGE DATA)');
});
