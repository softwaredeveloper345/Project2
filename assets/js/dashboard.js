// Dashboard functionality for static HTML version

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Show database status
    showDatabaseStatus();
    
    // Tab switching
    document.querySelectorAll('.menu-link[data-tab]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active classes
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding tab
            const tabId = this.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleProfileUpdate();
        });
    }
    
    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handlePasswordChange();
        });
    }
    
    // File upload handlers
    setupFileUploads();
    
    // Password confirmation validation
    const confirmPasswordField = document.getElementById('confirm_new_password');
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', function() {
            const password = document.getElementById('new_password').value;
            const confirmPassword = this.value;
            
            if (password !== confirmPassword) {
                this.setCustomValidity('Şifreler eşleşmiyor');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});

async function handleProfileUpdate() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const formData = new FormData(document.getElementById('profileForm'));
    const updateData = {
        first_name: formData.get('first_name').trim(),
        last_name: formData.get('last_name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        reference: formData.get('reference').trim(),
        bio: formData.get('bio').trim(),
        gender: formData.get('gender'),
        terms_accepted: formData.get('terms_accepted') === 'on'
    };
    
    // Validation
    if (!updateData.first_name || !updateData.last_name || !updateData.email) {
        showAlert('Ad, soyad ve e-posta alanları zorunludur.', 'error');
        return;
    }
    
    if (!updateData.terms_accepted) {
        showAlert('Profili güncellemek için kullanıcı sözleşmesini kabul etmelisiniz.', 'error');
        return;
    }
    
    // Simulate file upload processing - Safe version
    let profileImageFile = null;
    let secondaryImageFile = null;
    
    try {
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput && profileImageInput.files && profileImageInput.files.length > 0) {
            profileImageFile = profileImageInput.files[0];
        }
    } catch (e) {
        console.warn('Profile image input error:', e);
    }
    
    try {
        const secondaryImageInput = document.getElementById('secondaryImageInput');
        if (secondaryImageInput && secondaryImageInput.files && secondaryImageInput.files.length > 0) {
            secondaryImageFile = secondaryImageInput.files[0];
        }
    } catch (e) {
        console.warn('Secondary image input error:', e);
    }
    
    if (profileImageFile) {
        updateData.profile_image = 'uploads/demo-profile-' + Date.now() + '.jpg';
    }
    
    if (secondaryImageFile) {
        updateData.secondary_image = 'uploads/demo-secondary-' + Date.now() + '.jpg';
    }
    
    const result = await updateUserProfile(currentUser.id, updateData);
    
    if (result.success) {
        showAlert('Profil başarıyla güncellendi!', 'success');
        
        // Update localStorage current user
        const updatedUser = { ...currentUser, ...updateData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Reload user data
        loadUserData(updatedUser);
        
        // Simulate image updates if files were selected
        if (profileImageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const currentProfileImage = document.getElementById('currentProfileImage');
                const profileImagePlaceholder = document.getElementById('profileImagePlaceholder');
                const headerAvatar = document.getElementById('headerAvatar');
                const headerAvatarPlaceholder = document.getElementById('headerAvatarPlaceholder');
                
                if (currentProfileImage) {
                    currentProfileImage.src = e.target.result;
                    currentProfileImage.style.display = 'block';
                }
                if (profileImagePlaceholder) {
                    profileImagePlaceholder.style.display = 'none';
                }
                if (headerAvatar) {
                    headerAvatar.src = e.target.result;
                    headerAvatar.style.display = 'block';
                }
                if (headerAvatarPlaceholder) {
                    headerAvatarPlaceholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(profileImageFile);
        }
        
        if (secondaryImageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const currentSecondaryImage = document.getElementById('currentSecondaryImage');
                const secondaryImagePlaceholder = document.getElementById('secondaryImagePlaceholder');
                
                if (currentSecondaryImage) {
                    currentSecondaryImage.src = e.target.result;
                    currentSecondaryImage.style.display = 'block';
                }
                if (secondaryImagePlaceholder) {
                    secondaryImagePlaceholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(secondaryImageFile);
        }
        
    } else {
        showAlert(result.message, 'error');
    }
}

async function handlePasswordChange() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_new_password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Tüm şifre alanları zorunludur.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('Yeni şifre en az 6 karakter olmalıdır.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Yeni şifreler eşleşmiyor.', 'error');
        return;
    }
    
    // Verify current password
    if (currentUser.password !== currentPassword) {
        showAlert('Mevcut şifre yanlış.', 'error');
        return;
    }
    
    const result = await updateUserProfile(currentUser.id, { password: newPassword });
    
    if (result.success) {
        showAlert('Şifre başarıyla değiştirildi!', 'success');
        
        // Update current user password
        const updatedUser = { ...currentUser, password: newPassword };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Clear form
        document.getElementById('passwordForm').reset();
    } else {
        showAlert(result.message, 'error');
    }
}

function setupFileUploads() {
    // Profile image upload
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImagePreview.src = e.target.result;
                    profileImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Secondary image upload
    const secondaryImageInput = document.getElementById('secondaryImageInput');
    const secondaryImagePreview = document.getElementById('secondaryImagePreview');
    
    if (secondaryImageInput) {
        secondaryImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    secondaryImagePreview.src = e.target.result;
                    secondaryImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Drag and drop functionality
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                
                // Determine which input to use based on the upload area
                const isProfileArea = this.querySelector('p').textContent.includes('Profil');
                const input = isProfileArea ? 
                    document.getElementById('profileImageInput') : 
                    document.getElementById('secondaryImageInput');
                
                // Create a new FileList
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                
                // Trigger change event
                input.dispatchEvent(new Event('change'));
            }
        });
    });
}

// Load user data into form fields
function loadUserData(user) {
    if (!user) return;
    
    // Load form fields
    const firstNameField = document.getElementById('first_name');
    const lastNameField = document.getElementById('last_name');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const bioField = document.getElementById('bio');
    const genderField = document.getElementById('gender');
    const termsField = document.getElementById('terms_accepted');
    
    if (firstNameField) firstNameField.value = user.first_name || '';
    if (lastNameField) lastNameField.value = user.last_name || '';
    if (emailField) emailField.value = user.email || '';
    if (phoneField) phoneField.value = user.phone || '';
    if (bioField) bioField.value = user.bio || '';
    if (genderField) genderField.value = user.gender || '';
    if (termsField) termsField.checked = user.terms_accepted || false;
    
    // Load profile images
    const currentProfileImage = document.getElementById('currentProfileImage');
    const profileImagePlaceholder = document.getElementById('profileImagePlaceholder');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerAvatarPlaceholder = document.getElementById('headerAvatarPlaceholder');
    
    if (user.profile_image && currentProfileImage) {
        currentProfileImage.src = user.profile_image;
        currentProfileImage.style.display = 'block';
        if (profileImagePlaceholder) profileImagePlaceholder.style.display = 'none';
        
        if (headerAvatar) {
            headerAvatar.src = user.profile_image;
            headerAvatar.style.display = 'block';
        }
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.style.display = 'none';
    }
    
    // Load secondary image
    const currentSecondaryImage = document.getElementById('currentSecondaryImage');
    const secondaryImagePlaceholder = document.getElementById('secondaryImagePlaceholder');
    
    if (user.secondary_image && currentSecondaryImage) {
        currentSecondaryImage.src = user.secondary_image;
        currentSecondaryImage.style.display = 'block';
        if (secondaryImagePlaceholder) secondaryImagePlaceholder.style.display = 'none';
    }
}

// Update user profile function
async function updateUserProfile(userId, updateData) {
    try {
        // Check if database service is available
        if (window.db) {
            // Use database service to update user
            const users = await window.db.getAllUsers();
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex === -1) {
                return { success: false, message: 'Kullanıcı bulunamadı.' };
            }
            
            // Update user data
            users[userIndex] = { ...users[userIndex], ...updateData, updated_at: new Date().toISOString() };
            
            // Save back to storage
            if (window.db.isSupabaseReady) {
                // Try to update in Supabase
                try {
                    const { error } = await window.db.supabase
                        .from('users')
                        .update(updateData)
                        .eq('id', userId);
                    
                    if (error) {
                        console.error('Supabase update error:', error);
                        // Fall back to localStorage
                    }
                } catch (supabaseError) {
                    console.error('Supabase update failed:', supabaseError);
                }
            }
            
            // Always update localStorage as backup
            const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
            const localUserIndex = mockUsers.findIndex(u => u.id == userId);
            if (localUserIndex !== -1) {
                mockUsers[localUserIndex] = users[userIndex];
                localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
            }
            
            return { success: true, user: users[userIndex] };
            
        } else {
            // Direct localStorage update
            const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
            const userIndex = mockUsers.findIndex(u => u.id == userId);
            
            if (userIndex === -1) {
                return { success: false, message: 'Kullanıcı bulunamadı.' };
            }
            
            mockUsers[userIndex] = { ...mockUsers[userIndex], ...updateData, updated_at: new Date().toISOString() };
            localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
            
            return { success: true, user: mockUsers[userIndex] };
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, message: 'Profil güncellenirken hata oluştu: ' + error.message };
    }
}

// Utility function to show alerts
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.padding = '15px';
    alert.style.marginBottom = '20px';
    alert.style.borderRadius = '8px';
    alert.style.display = 'block';
    
    if (type === 'success') {
        alert.style.background = '#d4edda';
        alert.style.color = '#155724';
        alert.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        alert.style.background = '#f8d7da';
        alert.style.color = '#721c24';
        alert.style.border = '1px solid #f5c6cb';
    }
    
    alert.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Show database connection status
function showDatabaseStatus() {
    const status = db.getStatusMessage();
    const statusContainer = document.querySelector('.dashboard-header') || document.querySelector('.main-content');
    
    if (!statusContainer) return;
    
    // Remove existing status message
    const existingStatus = document.getElementById('databaseStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create status message
    const statusDiv = document.createElement('div');
    statusDiv.id = 'databaseStatus';
    statusDiv.style.cssText = `
        margin: 15px 0;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        ${status.type === 'warning' ? 
            'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : 
            'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
        }
    `;
    
    statusDiv.innerHTML = `
        <span style="font-size: 18px;">${status.icon}</span>
        <div style="flex: 1;">
            <strong>${status.title}:</strong> ${status.message}
            ${status.action ? `<br><small style="opacity: 0.8;">${status.action}</small>` : ''}
        </div>
        ${status.type === 'warning' ? `
            <button onclick="showDatabaseSetupInstructions()" 
                    style="background: #856404; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Kurulum Rehberi
            </button>
        ` : ''}
    `;
    
    statusContainer.insertBefore(statusDiv, statusContainer.firstChild);
}

// Show database setup instructions
function showDatabaseSetupInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin-top: 0; color: #333;">🗄️ Gerçek Veritabanı Kurulumu</h3>
            
            <div style="margin: 20px 0;">
                <h4>1. Supabase Hesabı Oluşturun</h4>
                <p>• <a href="https://supabase.com" target="_blank">supabase.com</a> adresinden ücretsiz hesap açın</p>
                <p>• Yeni proje oluşturun</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>2. Veritabanı Tablolarını Oluşturun</h4>
                <textarea readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 12px; background: #f8f9fa; border: 1px solid #ddd; padding: 10px;">
-- Users tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    profile_image TEXT,
    secondary_image TEXT,
    bio TEXT,
    phone VARCHAR(20),
    gender VARCHAR(10),
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Activities tablosu
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
                </textarea>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>3. API Anahtarlarınızı Alın</h4>
                <p>• Project Settings > API'den URL ve ANON key'inizi kopyalayın</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>4. Konfigürasyonu Güncelleyin</h4>
                <p><code>assets/js/database.js</code> dosyasındaki aşağıdaki satırları güncelleyin:</p>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px;">
this.supabaseUrl = 'YOUR_SUPABASE_URL';
this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY';</pre>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    Anladım
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}