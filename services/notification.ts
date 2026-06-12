// Fitur Anti-Preview Notification
// Menyamarkan notifikasi pesan masuk menjadi notifikasi sistem/cuaca

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  }
};

export const showStealthNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    // Payload notifikasi lokal HANYA menampilkan teks statis penyamaran sistem
    // Tidak memunculkan string pesan chat asli demi keamanan (Anti-Preview)
    new Notification('Pembaruan Sistem', {
      body: 'Pembaruan sistem selesai. Cuaca saat ini terpantau stabil.',
      icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png', // Ikon cuaca samaran
      silent: true, // Mode senyap agar tidak mencurigakan
    });
  }
};
