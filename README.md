# Penjelasan Akses Lokasi di HP (Mobile)

**Ya, aplikasi ini BISA mengakses lokasi secara otomatis saat dibuka di HP.**

Pada file `WeatherScreen.tsx`, kita sudah menggunakan API bawaan browser yaitu `navigator.geolocation.getCurrentPosition()`. 

Agar fitur lokasi ini berjalan lancar di HP Anda, ada beberapa syarat yang harus dipenuhi:

### 1. Izin Pengguna (Permission)
Saat halaman cuaca pertama kali dimuat, browser di HP (seperti Chrome atau Safari) akan memunculkan *pop-up* peringatan: **"Aplikasi ini ingin mengakses lokasi Anda"**. Anda harus menekan tombol **Izinkan (Allow)**.

### 2. Wajib Menggunakan HTTPS
Demi keamanan privasi, browser modern di HP **hanya mengizinkan** akses lokasi jika aplikasi di-hosting menggunakan koneksi aman (**HTTPS**). 
* *Pengecualian:* Jika Anda menjalankan aplikasi ini secara lokal di komputer untuk testing (menggunakan `localhost` atau `127.0.0.1`), lokasi tetap bisa diakses meski tanpa HTTPS. Namun jika diakses lewat IP address di HP (misal: `http://192.168.1.5:3000`), akses lokasi akan diblokir oleh browser HP.

### 3. GPS HP Harus Aktif
Pastikan fitur Lokasi / GPS di pengaturan (Settings) HP Anda dalam keadaan menyala.

---

### 💡 Catatan Jika Dijadikan Aplikasi Native (APK / iOS)
Karena Anda sebelumnya menyebutkan **Flutter**, jika kode web React ini nantinya dibungkus menjadi aplikasi Android/iOS asli (misalnya menggunakan *WebView*, *Capacitor*, atau *Cordova*), Anda **wajib** menambahkan izin lokasi di file konfigurasi native-nya:

**Untuk Android (di `AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**Untuk iOS (di `Info.plist`):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikasi ini membutuhkan lokasi Anda untuk menampilkan cuaca yang akurat.</string>
```

### Bagaimana Alurnya di Aplikasi Ini?
1. HP mendeteksi koordinat (Latitude & Longitude).
2. Aplikasi mengirim koordinat tersebut ke API **Open-Meteo** untuk mengambil data suhu dan kondisi cuaca (Hujan/Cerah).
3. Aplikasi juga mengirim koordinat ke API **OpenStreetMap (Nominatim)** untuk mengubah titik koordinat menjadi nama Kota/Desa tempat Anda berada saat ini.
4. Nama kota dan cuaca akan langsung tampil di layar depan sebagai kamuflase yang sempurna!
