// Updated register function to use database.js
async function register(userData) {
    try {
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

        // Use database service to create user
        const result = await db.createUser(newUserData);
        
        if (result.success) {
            // Log activity
            await db.logActivity(result.user.id, 'register', 'Yeni kullanıcı kaydı oluşturuldu');
            return { success: true, user: result.user };
        } else {
            return { success: false, message: 'Kullanıcı oluşturulamadı' };
        }
        
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Bir hata oluştu. Tekrar deneyin.' };
    }
}
