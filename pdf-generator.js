// Simple PDF Generator for User Agreement
function generateSimplePDF() {
    try {
        console.log('📄 Basit PDF oluşturuluyor...');
        
        // Create PDF content as HTML string
        const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kullanıcı Sözleşmesi</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { text-align: center; color: #333; font-size: 18px; }
        h2 { text-align: center; color: #666; font-size: 16px; margin-bottom: 30px; }
        h3 { color: #444; font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        p { text-align: justify; margin-bottom: 15px; }
        .signature { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <h1>6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU</h1>
    <h2>KAPSAMINDA AYDINLATMA METNİ</h2>
    
    <h3>1. Veri Sorumlusu</h3>
    <p>6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca www.hayırlıolsun.com veri sorumlusu olarak hareket etmektedir.</p>
    
    <h3>2. Verilerin İşlenmesi</h3>
    <p>www.hayırlıolsun.com olarak düzenlediğiniz bu form uyarınca kişisel verileriniz; işbu etkinlik ve diğer etkinliklerin planlanması, duyurulması, üçüncü kişilerin bilgilendirilmesi ve oluşumumuzun tanıtılması amacıyla işlenmektedir.</p>
    
    <h3>3. Kişisel Verilerinizin Aktarılması</h3>
    <p>Site yönetimimiz, yasal olarak aktarılması gereken idari ve resmi makamlara, faaliyetlerimizi yürütmek üzere dışarıdan hizmet alınan üçüncü kişilere aktarabilecektir.</p>
    
    <h3>4. Veri Sahibinin Hakları</h3>
    <p>6698 sayılı Kanunun 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini isteme haklarınız bulunmaktadır.</p>
    
    <h3>5. Açık Rıza Metni</h3>
    <p>Kişisel verilerimin aydınlatma metninde belirtilen amaçlarla işlenmesine ve üçüncü kişi veya kurumlara aktarılmasına açık rızam vardır.</p>
    
    <div class="signature">
        <h3>İMZA</h3>
        <p>İsim-Soyisim: _________________________</p>
        <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
        <p>İmza: _________________________</p>
    </div>
</body>
</html>`;

        // Create blob and download as HTML file that can be printed as PDF
        const blob = new Blob([pdfContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kullanici-sozlesmesi.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show instructions
        setTimeout(() => {
            alert('📄 HTML dosyası indirildi!\n\nPDF olarak kaydetmek için:\n1. İndirilen dosyayı açın\n2. Ctrl+P ile yazdırma menüsünü açın\n3. "PDF olarak kaydet" seçeneğini seçin\n4. Kaydet butonuna tıklayın');
        }, 500);
        
        return true;
        
    } catch (error) {
        console.error('❌ HTML generation error:', error);
        return false;
    }
}