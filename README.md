# Kullanıcı Yönetim Sistemi - Static HTML Versiyonu

Bu proje, PHP tabanlı kullanıcı yönetim sisteminin Netlify hosting için HTML/JavaScript'e dönüştürülmüş halidir.

## 🚀 Özellikler

- **Kullanıcı Kayıt/Giriş Sistemi**: localStorage tabanlı oturum yönetimi
- **Profil Yönetimi**: Kullanıcı bilgileri ve fotoğraf yükleme
- **Admin Paneli**: Kullanıcı yönetimi, foto galeri ve aktivite izleme
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu arayüz
- **Demo Hesaplar**: Hızlı test için hazır kullanıcı hesapları

## 📁 Proje Yapısı

```
user-management-static/
├── index.html              # Ana sayfa
├── login.html              # Giriş sayfası
├── register.html           # Kayıt sayfası
├── dashboard.html          # Kullanıcı paneli
├── admin/
│   └── dashboard.html      # Admin paneli
├── assets/
│   ├── css/
│   │   ├── dashboard.css   # Dashboard stilleri
│   │   └── admin.css       # Admin panel stilleri
│   └── js/
│       ├── auth.js         # Kimlik doğrulama
│       ├── dashboard.js    # Kullanıcı dashboard
│       └── admin.js        # Admin işlevleri
├── uploads/                # Yüklenen dosyalar için
├── netlify.toml           # Netlify konfigürasyonu
└── README.md              # Bu dosya
```

## 🎯 Demo Hesaplar

### Admin Hesabı
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin123`
- **Yetki**: Tam yönetici yetkisi

### Kullanıcı Hesapları
- **Kullanıcı Adı**: `john_doe` | **Şifre**: `user123`
- **Kullanıcı Adı**: `jane_smith` | **Şifre**: `user123`

## 🌐 Netlify'de Deployment

### 1. Netlify'de Yeni Site Oluşturma

1. [Netlify Dashboard](https://app.netlify.com/)'a gidin
2. "Add new site" → "Deploy manually" seçin
3. Proje klasörünü drag & drop yapın
4. Deploy işlemini bekleyin

### 2. Git ile Otomatik Deployment

```bash
# GitHub repository oluşturun
git init
git add .
git commit -m "Initial commit - User Management System"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# Netlify'de "New site from Git" seçin
# GitHub repository'nizi bağlayın
```

### 3. Özel Domain (Opsiyonel)

1. Netlify Dashboard → Site Settings → Domain management
2. "Add custom domain" ile kendi domain'inizi ekleyin
3. DNS ayarlarını yapılandırın

## ⚙️ Teknik Detaylar

### localStorage Kullanımı
- **mockUsers**: Kullanıcı veritabanı simülasyonu
- **mockActivities**: Sistem aktiviteleri
- **userSession**: Aktif oturum bilgisi

### Güvenlik
- XSS koruması için input sanitization
- CSRF protection headers
- Secure session management

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔧 Geliştirme

### Local Development

```bash
# Basit HTTP server başlatın
python -m http.server 8000
# veya
npx serve .

# Browser'da açın: http://localhost:8000
```

### Customization

1. **Renk Teması**: `assets/css/dashboard.css` dosyasını düzenleyin
2. **Demo Veriler**: `assets/js/auth.js` içindeki `mockUsers` array'ini güncelleyin
3. **Yeni Özellikler**: JavaScript dosyalarına yeni fonksiyonlar ekleyin

## 📝 Changelog

### v2.0.0 (Static HTML Version)
- ✅ PHP kodları HTML/JavaScript'e dönüştürüldü
- ✅ localStorage tabanlı veri yönetimi
- ✅ Admin foto galeri özelliği eklendi
- ✅ Responsive tasarım iyileştirildi
- ✅ Netlify deployment hazırlığı

### v1.0.0 (PHP Version)
- ✅ SQLite veritabanı ile kullanıcı yönetimi
- ✅ Session tabanlı kimlik doğrulama
- ✅ Dosya yükleme sistemi
- ✅ Admin paneli

## 🐛 Bilinen Sorunlar

- Dosya yükleme işlemi sadece preview modunda çalışır (gerçek upload yok)
- localStorage limiti (5-10MB) büyük miktarda veri için yetersiz olabilir
- Gerçek email gönderimi mevcut değil (demo amaçlı)

## 📞 Destek

Sorularınız için:
- Issue açın: GitHub repository issues
- Email: support@example.com

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.