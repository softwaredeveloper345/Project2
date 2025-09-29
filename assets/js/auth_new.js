// Authentication management for static HTML version
// Using database.js for data management

// Mock users database for initial load
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

// Initialize mock data if not exists
function initializeMockData() {
    if (!localStorage.getItem('mockUsers')) {
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    }
    
    if (!localStorage.getItem('mockActivities')) {
        const activities = [
            {
                id: 1,
                user_id: 2,
                action: 'login',
                description: 'Sisteme giriş yapıldı',
                ip_address: '192.168.1.100',
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                user_id: 3,
                action: 'profile_update',
                description: 'Profil bilgileri güncellendi',
                ip_address: '192.168.1.101',
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        localStorage.setItem('mockActivities', JSON.stringify(activities));
    }
}

// Get all users using database service
async function getAllUsers() {
    return await db.getAllUsers();
}

// Get user by ID using database service
async function getUserById(userId) {
    return await db.getUserById(userId);
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Login function
async function login(username, password) {
    try {
        const users = await db.getAllUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Update last login
            await db.updateUser(user.id, { last_login: new Date().toISOString() });
            
            // Log activity
            await db.logActivity(user.id, 'login', 'Sisteme giriş yapıldı');

            // Store current user
            localStorage.setItem('currentUser', JSON.stringify(user));

            return { success: true, user: user };
        }

        return { success: false, message: 'Kullanıcı adı veya şifre hatalı!' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Giriş yapılırken bir hata oluştu!' };
    }
}

// Register function - UPDATED TO USE DATABASE.JS
async function register(userData) {
    try {
        console.log('📝 Register işlemi başlıyor:', userData);
        
        // Check if username or email already exists
        const existingUsers = await db.getAllUsers();
        const existingUser = existingUsers.find(u => 
            u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
            return { 
                success: false, 
                message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor!' 
            };
        }

        // Create new user data
        const newUserData = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: 'user',
            status: 'active',
            bio: '',
            phone: '',
            gender: userData.gender || null,
            profile_image: null,
            secondary_image: null,
            terms_accepted: userData.terms_accepted || false,
            terms_accepted_at: userData.terms_accepted ? new Date().toISOString() : null
        };

        console.log('📝 Database.js ile kullanıcı oluşturuluyor:', newUserData);

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

// Log activity
async function logActivity(userId, action, description) {
    return await db.logActivity(userId, action, description);
}

// Logout function
function logout() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Log activity (async but don't wait)
        db.logActivity(currentUser.id, 'logout', 'Sistemden çıkış yapıldı');
    }
    localStorage.removeItem('currentUser');
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

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for database to be ready
    setTimeout(() => {
        initializeMockData();
        console.log('🔧 Auth system initialized with database integration');
    }, 100);
});
