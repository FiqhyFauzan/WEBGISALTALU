// Konfigurasi Supabase
const supabaseUrl = 'https://uujipziwbrfbuwxkbbbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amlweml3YnJmYnV3eGtiYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDU1MzIsImV4cCI6MjA3NTMyMTUzMn0.5qJhxm7U2-DKHLS9C72Gyjly-ApEX02fUBuv_b65bvc';

// Inisialisasi Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variabel global
let peta;
let markers = [];
let currentUser = null;
let isMapInitialized = false;
let koordinatTerpilih = null;

// Data user/admin
const users = [
    { username: 'admin', password: 'password123', role: 'admin' },
    { username: 'alfamidi', password: 'alfamidi123', role: 'admin' }
];

// Data lokasi Alfamidi default
const defaultLokasiAlfamidi = [
    { nama: "Alfamidi Palu Central", latitude: -0.895, longitude: 119.870, alamat: "Jl. Dr. Sutomo No. 15, Palu" },
    { nama: "Alfamidi Mall Palu", latitude: -0.892, longitude: 119.868, alamat: "Mall Palu Lt. 1, Jl. Monginsidi" },
    { nama: "Alfamidi Tondo", latitude: -0.898, longitude: 119.865, alamat: "Jl. Raya Tondo No. 28" },
    { nama: "Alfamidi Bandara", latitude: -0.918, longitude: 119.909, alamat: "Bandara Mutiara, Jl. Thalua Konchi" },
    { nama: "Alfamidi Pelabuhan", latitude: -0.910, longitude: 119.850, alamat: "Kawasan Pelabuhan Palu" },
    { nama: "Alfamidi Untad", latitude: -0.868, longitude: 119.872, alamat: "Jl. Soekarno Hatta, Dekat Universitas Tadulako" },
    { nama: "Alfamidi Pantai Talise", latitude: -0.885, longitude: 119.850, alamat: "Jl. Raya Talise No. 45" },
    { nama: "Alfamidi Pasar Sentral", latitude: -0.897, longitude: 119.872, alamat: "Pasar Sentral Palu Blok A-12" },
    { nama: "Alfamidi Islamic Center", latitude: -0.890, longitude: 119.875, alamat: "Jl. Diponegoro No. 22" },
    { nama: "Alfamidi Lere", latitude: -0.930, longitude: 119.890, alamat: "Jl. Raya Lere No. 78" }
];

// ==================== FUNGSI UTAMA ====================

// Fungsi untuk masuk sebagai user
function enterAsUser() {
    console.log("Masuk sebagai Pengguna");
    currentUser = null;
    showMainApp();
    if (!isMapInitialized) {
        initializeMap();
    }
    initializeMarkers();
    updateUI();
}

// Fungsi untuk menampilkan modal login admin
function showAdminLogin() {
    console.log("Menampilkan modal login admin");
    const loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'block';
}

// Fungsi untuk menutup modal login
function closeLoginModal() {
    console.log("Menutup modal login");
    const loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Fungsi untuk menampilkan aplikasi utama
function showMainApp() {
    console.log("Menampilkan aplikasi utama");
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
}

// Fungsi untuk kembali ke home
function backToHome() {
    console.log("Kembali ke home");
    document.getElementById('homePage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Reset state
    currentUser = null;
    isMapInitialized = false;
    koordinatTerpilih = null;
    
    // Hapus peta jika ada
    if (peta) {
        peta.remove();
        peta = null;
    }
    
    // Reset markers
    markers = [];
}

// ==================== FUNGSI PETA ====================

// Fungsi untuk inisialisasi peta
function initializeMap() {
    console.log("Menginisialisasi peta");
    
    // Hapus peta lama jika ada
    if (peta) {
        peta.remove();
    }
    
    // Inisialisasi peta baru
    peta = L.map('peta').setView([-0.900, 119.870], 13);
    
    // Tambahkan tile layer dari OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(peta);
    
    isMapInitialized = true;
    
    // Setup event listeners untuk peta
    peta.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        console.log("Klik peta di:", lat, lng);
        
        // Tampilkan koordinat di panel info
        document.getElementById('koordinat').textContent = lat.toFixed(4) + ", " + lng.toFixed(4);
        
        if (!currentUser) {
            document.getElementById('status').textContent = "Login sebagai admin untuk menambah marker";
        } else {
            document.getElementById('status').textContent = "Klik 'Tambah dari Klik Peta' untuk menambahkan";
            
            // Isi otomatis form input koordinat
            document.getElementById('latitude').value = lat.toFixed(4);
            document.getElementById('longitude').value = lng.toFixed(4);
            
            // Simpan koordinat yang diklik
            koordinatTerpilih = [lat, lng];
        }
    });
    
    console.log("Peta berhasil diinisialisasi");
}

// ==================== FUNGSI SUPABASE ====================

// Fungsi untuk mendapatkan semua lokasi dari Supabase
async function getAllLocations() {
    try {
        console.log('Mengambil data dari Supabase...');
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error mengambil data dari Supabase:', error);
            return defaultLokasiAlfamidi;
        }

        console.log('Data berhasil diambil dari Supabase:', data?.length || 0, 'lokasi');
        
        if (!data || data.length === 0) {
            console.log('Tidak ada data di Supabase, menggunakan data default');
            // Normalisasi data default agar memiliki shape yang sama seperti hasil dari Supabase
            return defaultLokasiAlfamidi.map((item, idx) => ({
                id: null,
                nama: item.nama,
                koordinat: [item.latitude, item.longitude],
                alamat: item.alamat
            }));
        }

        // Normalisasi dan konversi tipe data
        const normalized = data.map(item => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            return {
                id: item.id,
                nama: item.nama || item.nama_titik || 'Alfamidi',
                koordinat: [Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null],
                alamat: item.alamat || item.address || ''
            };
        }).filter(i => i.koordinat[0] !== null && i.koordinat[1] !== null);

        if (normalized.length === 0) {
            console.log('Data Supabase tidak berisi koordinat valid, menggunakan default ter-normalisasi');
            return defaultLokasiAlfamidi.map((item) => ({
                id: null,
                nama: item.nama,
                koordinat: [item.latitude, item.longitude],
                alamat: item.alamat
            }));
        }

        return normalized;
    } catch (error) {
        console.error('Error dalam getAllLocations:', error);
        return defaultLokasiAlfamidi;
    }
}

// Fungsi untuk menambah lokasi baru ke Supabase
async function addLocationToSupabase(nama, latitude, longitude, alamat) {
    try {
        console.log('Menambah lokasi baru ke Supabase:', { nama, latitude, longitude, alamat });
        
        const { data, error } = await supabase
            .from('locations')
            .insert([
                { 
                    nama: nama, 
                    latitude: latitude, 
                    longitude: longitude, 
                    alamat: alamat 
                }
            ])
            .select();

        if (error) {
            console.error('Error menambah lokasi ke Supabase:', error);
            throw error;
        }

        console.log('Lokasi berhasil ditambahkan ke Supabase:', data[0]);
        return data[0];
    } catch (error) {
        console.error('Error dalam addLocationToSupabase:', error);
        throw error;
    }
}

// Fungsi untuk menghapus lokasi dari Supabase
async function deleteLocationFromSupabase(locationId) {
    try {
        console.log('Menghapus lokasi dari Supabase, ID:', locationId);
        
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', locationId);

        if (error) {
            console.error('Error menghapus lokasi dari Supabase:', error);
            throw error;
        }

        console.log('Lokasi berhasil dihapus dari Supabase, ID:', locationId);
        return true;
    } catch (error) {
        console.error('Error dalam deleteLocationFromSupabase:', error);
        throw error;
    }
}

// Fungsi untuk menghapus semua lokasi dari Supabase
async function deleteAllLocationsFromSupabase() {
    try {
        console.log('Menghapus semua lokasi dari Supabase...');
        
        const { error } = await supabase
            .from('locations')
            .delete()
            .neq('id', 0);

        if (error) {
            console.error('Error menghapus semua lokasi dari Supabase:', error);
            throw error;
        }

        console.log('Semua lokasi berhasil dihapus dari Supabase');
        return true;
    } catch (error) {
        console.error('Error dalam deleteAllLocationsFromSupabase:', error);
        throw error;
    }
}

// ==================== FUNGSI MARKER ====================

// Fungsi untuk inisialisasi marker
async function initializeMarkers() {
    console.log("Menginisialisasi marker");
    
    // Tampilkan loading status
    document.getElementById('status').textContent = "Memuat data lokasi...";
    
    // Hapus semua marker yang ada
    markers.forEach(function(markerObj) {
        if (markerObj.marker && peta) {
            peta.removeLayer(markerObj.marker);
        }
    });
    markers = [];
    
    // Muat data markers
    const lokasiAlfamidi = await getAllLocations();
    
    // Tambahkan marker untuk setiap lokasi Alfamidi
    lokasiAlfamidi.forEach(function(lokasi, index) {
        addMarkerToMap(lokasi.koordinat[0], lokasi.koordinat[1], lokasi.nama, lokasi.alamat, lokasi.id, index);
    });
    
    // Update UI
    updateDaftarMarker();
    document.getElementById('jumlahMarker').textContent = markers.length;
    document.getElementById('status').textContent = "Data lokasi berhasil dimuat";
    
    console.log("Marker berhasil diinisialisasi:", markers.length, "lokasi");
}

// Fungsi untuk menambah marker ke peta
function addMarkerToMap(lat, lng, nama, alamat, supabaseId = null, index = null) {
    const markerIndex = index !== null ? index : markers.length;
    
    // Buat marker baru
    const marker = L.marker([lat, lng]).addTo(peta);
    
    // Buat konten popup
    let popupContent = `
        <div class='popup-title'>${nama}</div>
        <div class='popup-coords'>Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        <div class='popup-alamat'>${alamat}</div>
    `;
    
    if (currentUser && supabaseId) {
        popupContent += `<button class='popup-button' onclick='hapusMarkerIni(${markerIndex})'>Hapus Lokasi</button>`;
    }
    
    marker.bindPopup(popupContent);
    
    // Simpan informasi marker
    markers.push({
        id: supabaseId || markerIndex,
        nama: nama,
        koordinat: [lat, lng],
        alamat: alamat,
        marker: marker,
        supabase_id: supabaseId
    });
}

// Fungsi untuk menambah marker dari koordinat
async function tambahMarkerDariKoordinat(lat, lng, nama, alamat) {
    try {
        // Tambahkan ke Supabase jika user adalah admin
        let newLocation = null;
        if (currentUser) {
            newLocation = await addLocationToSupabase(nama, lat, lng, alamat);
        }
        
        // Tambahkan marker ke peta
        addMarkerToMap(lat, lng, nama, alamat, newLocation ? newLocation.id : null);
        
        // Perbarui UI
        document.getElementById('jumlahMarker').textContent = markers.length;
        document.getElementById('status').textContent = currentUser ? 
            "Lokasi Alfamidi berhasil ditambahkan ke database" : 
            "Lokasi Alfamidi berhasil ditambahkan (local)";
        
        updateDaftarMarker();
        
        // Fokus ke marker baru
        peta.setView([lat, lng], 15);
        
        console.log('Marker baru ditambahkan:', { nama, lat, lng });
        
    } catch (error) {
        console.error('Error dalam tambahMarkerDariKoordinat:', error);
        document.getElementById('status').textContent = "Error: Gagal menambahkan lokasi";
    }
}

// Fungsi untuk menghapus marker tertentu
async function hapusMarkerIni(index) {
    if (!currentUser) {
        alert("Silakan login sebagai admin untuk menghapus marker");
        return;
    }
    
    if (markers[index]) {
        const namaMarker = markers[index].nama;
        const supabaseId = markers[index].supabase_id;
        
        // Tampilkan loading
        document.getElementById('status').textContent = "Menghapus lokasi...";
        
        try {
            // Hapus dari Supabase jika ada ID dan user adalah admin
            if (supabaseId && currentUser) {
                await deleteLocationFromSupabase(supabaseId);
            }
            
            // Hapus dari peta
            peta.removeLayer(markers[index].marker);
            markers.splice(index, 1);
            
            // Perbarui UI
            document.getElementById('jumlahMarker').textContent = markers.length;
            document.getElementById('status').textContent = "Lokasi Alfamidi berhasil dihapus";
            
            updateDaftarMarker();
            
            console.log('Marker dihapus:', namaMarker);
        } catch (error) {
            document.getElementById('status').textContent = "Error: Gagal menghapus lokasi";
            console.error('Error menghapus marker:', error);
        }
    }
}

// Fungsi untuk menghapus semua marker
async function hapusSemuaMarker() {
    if (!currentUser) {
        alert("Silakan login sebagai admin untuk menghapus semua marker");
        return;
    }
    
    if (!confirm("Apakah Anda yakin ingin menghapus semua lokasi Alfamidi?")) {
        return;
    }
    
    // Tampilkan loading
    document.getElementById('status').textContent = "Menghapus semua lokasi...";
    
    try {
        // Hapus dari Supabase jika user adalah admin
        if (currentUser) {
            await deleteAllLocationsFromSupabase();
        }
        
        // Hapus semua marker dari peta
        markers.forEach(function(marker) {
            peta.removeLayer(marker.marker);
        });
        
        // Kosongkan array markers
        markers = [];
        
        // Perbarui UI
        document.getElementById('jumlahMarker').textContent = 0;
        document.getElementById('koordinat').textContent = "-";
        document.getElementById('status').textContent = "Semua lokasi Alfamidi telah dihapus";
        
        updateDaftarMarker();
        
        console.log('Semua markers dihapus');
    } catch (error) {
        document.getElementById('status').textContent = "Error: Gagal menghapus semua lokasi";
        console.error('Error menghapus semua markers:', error);
    }
}

// ==================== FUNGSI UI ====================

// Update UI setelah login/logout
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const adminControls = document.getElementById('adminControls');
    const loginStatus = document.getElementById('loginStatus');

    if (currentUser) {
        // User sudah login (admin)
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userInfo.style.display = 'flex';
        userInfo.innerHTML = `<i class="fas fa-user-check"></i> ${currentUser.username} (Admin)`;
        userInfo.className = 'user-info admin';
        adminControls.style.display = 'block';
        
        loginStatus.textContent = 'Admin (Full Access)';
        loginStatus.className = 'info-value admin';
        
    } else {
        // User belum login (guest)
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        adminControls.style.display = 'none';
        
        loginStatus.textContent = 'Guest (View Only)';
        loginStatus.className = 'info-value guest';
    }
    
    // Update daftar marker
    updateDaftarMarker();
}

// Fungsi untuk memperbarui daftar marker di sidebar
function updateDaftarMarker() {
    const daftarMarker = document.getElementById('daftarMarker');
    daftarMarker.innerHTML = '';
    
    if (markers.length === 0) {
        daftarMarker.innerHTML = '<div class="marker-item" style="justify-content: center; color: var(--gray-text);">Tidak ada lokasi Alfamidi</div>';
        return;
    }
    
    markers.forEach(function(marker, index) {
        const markerItem = document.createElement('div');
        markerItem.className = 'marker-item';
        
        let actionsHtml = '';
        if (currentUser) {
            actionsHtml = `
                <div class="marker-actions">
                    <button onclick="focusMarker(${index})"><i class="fas fa-eye"></i> Lihat</button>
                    <button onclick="hapusMarkerIni(${index})"><i class="fas fa-trash"></i> Hapus</button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="marker-actions">
                    <button onclick="focusMarker(${index})"><i class="fas fa-eye"></i> Lihat</button>
                </div>
            `;
        }
        
        markerItem.innerHTML = `
            <div class="marker-info">
                <strong>${marker.nama}</strong>
                <small>${marker.koordinat[0].toFixed(4)}, ${marker.koordinat[1].toFixed(4)}</small>
                <small>${marker.alamat}</small>
            </div>
            ${actionsHtml}
        `;
        
        daftarMarker.appendChild(markerItem);
    });
}

// Fungsi untuk fokus ke marker tertentu
function focusMarker(index) {
    if (markers[index]) {
        peta.setView(markers[index].koordinat, 15);
        markers[index].marker.openPopup();
    }
}

// ==================== EVENT LISTENERS ====================

// Inisialisasi event listeners saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplikasi ALTALU dimuat');
    
    // Sembunyikan aplikasi utama saat pertama kali load
    document.getElementById('mainApp').style.display = 'none';
    
    // Setup event listeners untuk home page
    document.getElementById('userBtn').addEventListener('click', enterAsUser);
    document.getElementById('adminBtn').addEventListener('click', showAdminLogin);
    
    // Setup event listeners untuk modal login
    document.getElementById('closeModal').addEventListener('click', closeLoginModal);
    document.getElementById('loginBtn').addEventListener('click', showAdminLogin);
    
    // Event listener untuk klik di luar modal
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        if (event.target == loginModal) {
            closeLoginModal();
        }
    });
    
    // Proses login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Login attempt:', username);
        
        // Cek kredensial
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            closeLoginModal();
            // Tampilkan aplikasi utama dan inisialisasi peta jika perlu
            showMainApp();
            if (!isMapInitialized) {
                initializeMap();
            }

            // Refresh markers dengan hak akses admin
            await initializeMarkers();
            updateUI();

            document.getElementById('status').textContent = "Login berhasil sebagai " + user.username;
            console.log('Login berhasil sebagai:', user.username);
        } else {
            alert('Username atau password salah!');
            console.log('Login gagal');
        }
        
        // Reset form
        document.getElementById('loginForm').reset();
    });
    
    // Proses logout
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        currentUser = null;
        await initializeMarkers(); // Refresh markers tanpa hak akses admin
        updateUI();
        document.getElementById('status').textContent = "Anda telah logout, kembali ke mode pengguna";
        console.log('Logout berhasil');
    });
    
    // Kembali ke home
    document.getElementById('backToHome').addEventListener('click', backToHome);

    // Mobile: toggle sidebar info
    const toggleInfoBtn = document.getElementById('toggleInfoBtn');
    // Create backdrop element for mobile sidebar
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    function openSidebarMobile() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.add('open');
        backdrop.classList.add('show');
    }

    function closeSidebarMobile() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('open');
        backdrop.classList.remove('show');
    }

    if (toggleInfoBtn) {
        toggleInfoBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;
            if (sidebar.classList.contains('open')) closeSidebarMobile();
            else openSidebarMobile();
        });
    }

    // Close on backdrop click
    backdrop.addEventListener('click', closeSidebarMobile);
    
    // Form input koordinat manual
    document.getElementById('formKoordinat').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert("Silakan login sebagai admin untuk menambah marker");
            return;
        }
        
        // Ambil nilai dari form
        const lat = parseFloat(document.getElementById('latitude').value);
        const lng = parseFloat(document.getElementById('longitude').value);
        let nama = document.getElementById('namaTitik').value;
        let alamat = document.getElementById('alamat').value;
        
        // Validasi input
        if (isNaN(lat) || isNaN(lng)) {
            alert("Error: Format koordinat tidak valid");
            return;
        }
        
        if (!nama) {
            nama = "Alfamidi " + (markers.length + 1);
        }
        
        if (!alamat) {
            alamat = "Alamat belum diisi";
        }
        
        // Tambahkan marker
        tambahMarkerDariKoordinat(lat, lng, nama, alamat);
        
        // Reset form
        document.getElementById('formKoordinat').reset();
    });
    
    // Tombol tambah marker dari klik peta
    document.getElementById('tambahMarker').addEventListener('click', function() {
        if (!currentUser) {
            alert("Silakan login sebagai admin untuk menambah marker");
            return;
        }
        
        if (!koordinatTerpilih) {
            alert("Silakan klik pada peta terlebih dahulu");
            return;
        }
        
        const lat = koordinatTerpilih[0];
        const lng = koordinatTerpilih[1];
        const nama = "Alfamidi " + (markers.length + 1);
        const alamat = "Alamat belum diisi";
        
        // Buat marker baru
        tambahMarkerDariKoordinat(lat, lng, nama, alamat);
        
        // Reset koordinat terpilih
        koordinatTerpilih = null;
        document.getElementById('koordinat').textContent = "-";
    });
    
    // Tombol hapus semua marker
    document.getElementById('hapusSemua').addEventListener('click', hapusSemuaMarker);
    
    // Setup kontrol peta
    document.getElementById('zoomIn').addEventListener('click', function() {
        if (peta) peta.zoomIn();
    });
    
    document.getElementById('zoomOut').addEventListener('click', function() {
        if (peta) peta.zoomOut();
    });
    
    document.getElementById('resetView').addEventListener('click', function() {
        if (peta) peta.setView([-0.900, 119.870], 13);
    });
    
    console.log('Semua event listener berhasil diinisialisasi');
});
