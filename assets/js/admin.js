// Admin Dashboard functionality for static HTML version

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        window.location.href = '../login.html';
        return;
    }
    
    if (currentUser.role !== 'admin') {
        window.location.href = '../dashboard.html';
        return;
    }
    
    // Initialize admin dashboard when database is ready
    if (window.onDatabaseReady) {
        window.onDatabaseReady(() => {
            initializeAdminDashboard().catch(console.error);
        });
    } else {
        // Fallback if database system not ready
        setTimeout(() => {
            initializeAdminDashboard().catch(console.error);
        }, 1000);
    }
    
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
            
            // Load tab content
            loadTabContent(tabId);
        });
    });
    
    // Initial load
    loadTabContent('overview');
});

async function initializeAdminDashboard() {
    try {
        console.log('🚀 Admin dashboard başlatılıyor...');
        await loadStatistics();
        await loadUsersTable();
        await loadPhotoGallery();
        await loadActivities();
        console.log('✅ Admin dashboard yüklendi');
    } catch (error) {
        console.error('❌ Admin dashboard yükleme hatası:', error);
    }
}

async function loadStatistics() {
    try {
        console.log('📊 İstatistikler yükleniyor...');
        const users = await getAllUsers();
        
        // Güvenlik kontrolü - users array olduğundan emin ol
        if (!Array.isArray(users)) {
            console.error('❌ Users data array değil:', users);
            return;
        }
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const adminUsers = users.filter(u => u.role === 'admin').length;
        const maleUsers = users.filter(u => u.gender === 'male').length;
        const femaleUsers = users.filter(u => u.gender === 'female').length;
        
        // DOM elementlerini güvenli şekilde güncelle
        const elements = {
            'totalUsersCount': totalUsers,
            'activeUsersCount': activeUsers,
            'adminUsersCount': adminUsers,
            'maleUsersCount': maleUsers,
            'femaleUsersCount': femaleUsers
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`⚠️ Element bulunamadı: ${id}`);
            }
        });
        
        console.log(`✅ İstatistikler yüklendi: ${totalUsers} kullanıcı`);
    } catch (error) {
        console.error('❌ İstatistik yükleme hatası:', error);
    }
}

async function loadUsersTable() {
    try {
        console.log('👥 Kullanıcı tablosu yükleniyor...');
        const users = await getAllUsers();
        const tableBody = document.getElementById('usersTableBody');
        
        if (!Array.isArray(users)) {
            console.error('❌ Users data array değil:', users);
            return;
        }
        
        if (!tableBody) {
            console.error('❌ usersTableBody elementi bulunamadı');
            return;
        }
    
    tableBody.innerHTML = users.map(user => {
        const userInitials = user.first_name.charAt(0) + user.last_name.charAt(0);
        const avatarHtml = user.profile_image ? 
            `<img src="${user.profile_image}" alt="Profile" style="cursor: pointer;" onclick="openPhotoModal('${user.profile_image}', '${user.first_name} ${user.last_name} - Profil Fotoğrafı')" title="Fotoğrafı büyütmek için tıklayın">` :
            `<div class="avatar-placeholder-sm">${userInitials}</div>`;
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div style="font-weight: 500;">${user.first_name} ${user.last_name}</div>
                            <div style="font-size: 12px; color: #666;">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge role-${user.role}">
                        ${user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewUser(${user.id})" class="btn btn-sm btn-primary" title="Görüntüle">
                            👁️
                        </button>
                        ${user.id !== getCurrentUser().id ? `
                            <button onclick="toggleUserStatus(${user.id}, '${user.status}')" 
                                    class="btn btn-sm btn-warning" title="Durum Değiştir">
                                🔄
                            </button>
                            <button onclick="changeUserRole(${user.id}, '${user.role}')" 
                                    class="btn btn-sm btn-info" title="Rol Değiştir">
                                👑
                            </button>
                            <button onclick="deleteUser(${user.id}, '${user.first_name} ${user.last_name}')" 
                                    class="btn btn-sm btn-danger" title="Sil">
                                🗑️
                            </button>
                        ` : `
                            <span style="color: #666; font-size: 12px;">Kendi hesabınız</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`✅ ${users.length} kullanıcı tablosu yüklendi`);
    } catch (error) {
        console.error('❌ Kullanıcı tablosu yükleme hatası:', error);
    }
}

async function loadPhotoGallery() {
    try {
        console.log('🖼️ Fotoğraf galerisi yükleniyor...');
        const users = await getAllUsers();
        
        if (!Array.isArray(users)) {
            console.error('❌ Users data array değil:', users);
            return;
        }
    const usersWithPhotos = users.filter(user => user.profile_image || user.secondary_image);
    const gallery = document.getElementById('photoGallery');
    
    if (usersWithPhotos.length === 0) {
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 15px;">📸</div>
                <p>Henüz fotoğraf yükleyen kullanıcı bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    gallery.innerHTML = usersWithPhotos.map(user => {
        const genderIcon = user.gender === 'male' ? '👨' : user.gender === 'female' ? '🧕' : '';
        
        return `
            <div class="photo-card">
                <h4>
                    ${user.first_name} ${user.last_name}
                    ${genderIcon ? `<span style="font-size: 18px; margin-left: 5px;">${genderIcon}</span>` : ''}
                </h4>
                <p class="username">@${user.username}</p>
                
                <div class="photo-images">
                    ${user.profile_image ? `
                        <img src="${user.profile_image}" 
                             class="photo-thumbnail profile"
                             onclick="openPhotoModal('${user.profile_image}', '${user.first_name} ${user.last_name} - Profil Fotoğrafı')"
                             title="Profil Fotoğrafı - Büyütmek için tıklayın">
                    ` : ''}
                    
                    ${user.secondary_image ? `
                        <img src="${user.secondary_image}" 
                             class="photo-thumbnail secondary"
                             onclick="openPhotoModal('${user.secondary_image}', '${user.first_name} ${user.last_name} - İkinci Fotoğraf')"
                             title="İkinci Fotoğraf - Büyütmek için tıklayın">
                    ` : ''}
                </div>
                
                <button onclick="viewUser(${user.id})" 
                        style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    Profili Görüntüle
                </button>
            </div>
        `;
    }).join('');
    
    console.log(`✅ ${usersWithPhotos.length} fotoğraf galerisi yüklendi`);
    } catch (error) {
        console.error('❌ Fotoğraf galerisi yükleme hatası:', error);
    }
}

async function loadActivities() {
    try {
        console.log('📋 Aktiviteler yükleniyor...');
        const activities = await getAllActivities(10);
        
        if (!Array.isArray(activities)) {
            console.error('❌ Activities data array değil:', activities);
            return;
        }
        
        // Load recent activities
        const recentList = document.getElementById('recentActivitiesList');
        if (recentList) {
            loadActivityList(recentList, activities.slice(0, 5));
        }
        
        // Load all activities
        const allList = document.getElementById('allActivitiesList');
        if (allList) {
            loadActivityList(allList, activities);
        }
        
        console.log(`✅ ${activities.length} aktivite yüklendi`);
    } catch (error) {
        console.error('❌ Aktivite yükleme hatası:', error);
    }
}

function loadActivityList(container, activities) {
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="icon">📋</i>
                <p>Henüz aktivite bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const icon = getActivityIcon(activity.action);
        const date = formatDate(activity.created_at);
        
        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-description">
                        <strong>${activity.first_name} ${activity.last_name}</strong>
                        (@${activity.username})
                        - ${activity.description}
                    </div>
                    <div class="activity-meta">
                        <span class="activity-date">${date}</span>
                        <span class="activity-ip">IP: ${activity.ip_address}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadTabContent(tabId) {
    switch(tabId) {
        case 'overview':
            loadStatistics();
            loadActivities();
            break;
        case 'users':
            loadUsersTable();
            break;
        case 'photos':
            loadPhotoGallery();
            break;
        case 'activities':
            loadActivities();
            break;
    }
}

function getActivityIcon(action) {
    const icons = {
        'login': '🔐',
        'logout': '🚪',
        'profile_update': '✏️',
        'password_change': '🔒',
        'register': '📝',
        'user_status_change': '🔄',
        'role_change': '👑',
        'user_delete': '🗑️',
        'admin_update_user': '⚙️',
        'admin_reset_password': '🔑'
    };
    return icons[action] || '📝';
}

// Admin action functions
function viewUser(userId) {
    const user = getUserById(userId);
    if (user) {
        // In a real implementation, this would open a detailed view modal
        // For demo, we'll show an alert with user info
        let details = `Kullanıcı Detayları:\n\n`;
        details += `Ad: ${user.first_name} ${user.last_name}\n`;
        details += `E-posta: ${user.email}\n`;
        if (user.phone) details += `Telefon: ${user.phone}\n`;
        if (user.reference) details += `Referans: ${user.reference}\n`;
        details += `Rol: ${user.role}\n`;
        details += `Durum: ${user.status}\n`;
        details += `Kayıt Tarihi: ${formatDate(user.created_at)}`;
        
        alert(details);
    }
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const user = getUserById(userId);
    
    if (confirm(`${user.first_name} ${user.last_name} kullanıcısının durumunu ${newStatus === 'active' ? 'aktif' : 'pasif'} yapmak istediğinizden emin misiniz?`)) {
        const result = updateProfile(userId, { status: newStatus });
        
        if (result.success) {
            showAlert(`Kullanıcı durumu ${newStatus === 'active' ? 'aktif' : 'pasif'} olarak güncellendi.`, 'success');
            logActivity(getCurrentUser().id, 'user_status_change', `User ${userId} status changed to ${newStatus}`);
            loadUsersTable();
            loadStatistics();
        } else {
            showAlert('Durum güncellenirken bir hata oluştu.', 'error');
        }
    }
}

function changeUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const user = getUserById(userId);
    
    if (confirm(`${user.first_name} ${user.last_name} kullanıcısının rolünü ${newRole === 'admin' ? 'yönetici' : 'kullanıcı'} yapmak istediğinizden emin misiniz?`)) {
        const result = updateProfile(userId, { role: newRole });
        
        if (result.success) {
            showAlert(`Kullanıcı rolü ${newRole === 'admin' ? 'yönetici' : 'kullanıcı'} olarak güncellendi.`, 'success');
            logActivity(getCurrentUser().id, 'role_change', `User ${userId} role changed to ${newRole}`);
            loadUsersTable();
            loadStatistics();
        } else {
            showAlert('Rol güncellenirken bir hata oluştu.', 'error');
        }
    }
}

function deleteUser(userId, userName) {
    if (confirm(`${userName} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
        const users = getAllUsers();
        const updatedUsers = users.filter(u => u.id !== userId);
        
        localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
        
        showAlert('Kullanıcı başarıyla silindi.', 'success');
        logActivity(getCurrentUser().id, 'user_delete', `User ${userId} (${userName}) deleted`);
        
        loadUsersTable();
        loadStatistics();
        loadPhotoGallery();
    }
}

// Photo modal functions
function openPhotoModal(imageSrc, caption) {
    document.getElementById('modalImage').src = imageSrc;
    document.getElementById('modalCaption').textContent = caption;
    document.getElementById('photoModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closePhotoModal() {
    document.getElementById('photoModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePhotoModal();
    }
});

function logoutUser() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        logout();
        window.location.href = '../index.html';
    }
}

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

// Show database connection status (shared function)
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