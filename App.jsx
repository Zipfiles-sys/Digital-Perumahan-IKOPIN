import React, { useState, useEffect } from 'react';

export default function App() {
  // --- STATE UTAMA ---
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [tempFile, setTempFile] = useState(null); 
  const [highlightId, setHighlightId] = useState(null); 
  
  const [rejectModal, setRejectModal] = useState({ show: false, aspirasiId: null, reason: '' });
  
  // State Data
  const [chatInput, setChatInput] = useState('');
  const [globalMessages, setGlobalMessages] = useState([]);
  const [aspirations, setAspirations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // --- LOGIKA MASA BERLAKU (30 Hari) ---
  const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    const cleanupExpiredData = () => {
      const now = Date.now();
      setGlobalMessages(prev => prev.filter(msg => (now - msg.createdAt) < MS_PER_MONTH));
      setAspirations(prev => prev.filter(asp => (now - asp.createdAt) < MS_PER_MONTH));
      setSchedules(prev => prev.filter(sch => (now - sch.createdAt) < MS_PER_MONTH));
    };
    cleanupExpiredData();
    
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => setHighlightId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nama.value;
    const pass = e.target.password.value;
    if (pass === '123') { setUser({ name, role: 'warga' }); setView('dashboard'); }
    else if (pass === 'admin') { setUser({ name, role: 'admin' }); setView('dashboard'); }
    else { alert("Kredensial tidak valid."); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto terlalu besar (Maks 2MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setTempFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const tambahAspirasi = (e) => {
    e.preventDefault();
    const baru = {
      id: "ID-" + Math.floor(Math.random() * 1000),
      nama: user.name,
      judul: e.target.judul.value,
      deskripsi: e.target.deskripsi.value,
      status: "DIKIRIM",
      lampiran: tempFile,
      alasanAdmin: null,
      createdAt: Date.now()
    };
    setAspirations([baru, ...aspirations]);
    setTempFile(null);
    setView('dashboard'); 
  };

  const kirimPesanGrup = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    const newMessage = {
      id: Date.now(),
      sender: user.name,
      role: user.role,
      text: chatInput,
      time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
      createdAt: Date.now()
    };
    setGlobalMessages([...globalMessages, newMessage]);
    setChatInput('');
  };

  const gantiStatus = (id, statusBaru) => {
    if (statusBaru === 'DITOLAK') {
      setRejectModal({ show: true, aspirasiId: id, reason: '' });
    } else {
      setAspirations(aspirations.map(a => a.id === id ? { ...a, status: statusBaru, alasanAdmin: null } : a));
    }
  };

  const submitPenolakan = () => {
    if (!rejectModal.reason.trim()) return alert("Alasan wajib diisi.");
    setAspirations(aspirations.map(a => a.id === rejectModal.aspirasiId ? { ...a, status: 'DITOLAK', alasanAdmin: rejectModal.reason } : a));
    setRejectModal({ show: false, aspirasiId: null, reason: '' });
  };

  const requestNotifyPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  const sendNotification = (title, body) => {
    if (notificationPermission === 'granted') {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png' });
    }
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const newSch = {
      id: "SCH-" + Math.floor(Math.random() * 10000),
      title: e.target.title.value,
      date: e.target.date.value,
      time: e.target.time.value,
      location: e.target.location.value,
      description: e.target.description.value,
      createdAt: Date.now()
    };
    setSchedules([newSch, ...schedules]);
    sendNotification("Jadwal Baru Ditambahkan", `${newSch.title} pada ${newSch.date} di ${newSch.location}`);
    setView('jadwal');
  };

  const deleteSchedule = (id) => {
    if(confirm("Hapus jadwal ini?")) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const lihatDiBeranda = (id) => {
    setHighlightId(id);
    setView('dashboard');
    setTimeout(() => {
      const element = document.getElementById(`card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const styles = {
    card: (isHighlighted) => ({ 
      background: 'white', 
      borderRadius: '16px', 
      boxShadow: isHighlighted ? '0 0 0 4px #2563eb' : '0 4px 6px -1px rgba(0,0,0,0.05)', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'all 0.4s ease',
      border: isHighlighted ? '2px solid #2563eb' : '1px solid #e2e8f0'
    }),
    input: { width: '100%', padding: '14px', margin: '8px 0', border: '1px solid #e2e8f0', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' },
    btn: { padding: '12px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' },
    badge: (s) => ({
      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content',
      background: s === 'SELESAI' ? '#f0fdf4' : s === 'DIPROSES' ? '#fefce8' : s === 'DITOLAK' ? '#fef2f2' : '#f8fafc',
      color: s === 'SELESAI' ? '#166534' : s === 'DIPROSES' ? '#854d0e' : s === 'DITOLAK' ? '#991b1b' : '#64748b',
      border: `1px solid ${s === 'SELESAI' ? '#bbf7d0' : s === 'DIPROSES' ? '#fef08a' : s === 'DITOLAK' ? '#fecaca' : '#e2e8f0'}`
    }),
    schCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      gap: '15px',
      alignItems: 'center'
    }
  };

  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ ...styles.card(false), width: '380px', padding: '40px', textAlign: 'center' }}>
          <div style={{ background: '#2563eb', width: '60px', height: '60px', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>4.0</div>
          <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Digital Desa 4.0</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Masuk untuk mengakses layanan warga.</p>
          <form onSubmit={handleLogin}>
            <input name="nama" placeholder="Nama Lengkap" style={styles.input} required />
            <input name="password" type="password" placeholder="Kata Sandi" style={styles.input} required />
            <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '10px' }}>Masuk Sistem</button>
          </form>
          {/* Bagian keterangan kredensial telah dihapus sesuai permintaan */}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f1f5f9' }}>
      
      {/* Sidebar */}
      <div style={{ width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ background: '#2563eb', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4.0</div>
          <h2 style={{ fontSize: '18px', margin: 0, color: '#1e293b' }}>Digital Desa</h2>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button onClick={() => setView('dashboard')} style={{ background: view === 'dashboard' ? '#f1f5f9' : 'none', border: 'none', color: view === 'dashboard' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>🏠 Beranda</button>
          <button onClick={() => setView('jadwal')} style={{ background: view === 'jadwal' ? '#f1f5f9' : 'none', border: 'none', color: view === 'jadwal' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>📅 Jadwal Desa</button>
          <button onClick={() => setView('chat_grup')} style={{ background: view === 'chat_grup' ? '#f1f5f9' : 'none', border: 'none', color: view === 'chat_grup' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>💬 Ruang Warga</button>
          {user.role === 'warga' && (
            <>
              <button onClick={() => setView('form')} style={{ background: view === 'form' ? '#f1f5f9' : 'none', border: 'none', color: view === 'form' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>✍️ Buat Aspirasi</button>
              <button onClick={() => setView('riwayat')} style={{ background: view === 'riwayat' ? '#f1f5f9' : 'none', border: 'none', color: view === 'riwayat' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>📋 Laporanku</button>
            </>
          )}
          {user.role === 'admin' && (
            <button onClick={() => setView('kelola')} style={{ background: view === 'kelola' ? '#f1f5f9' : 'none', border: 'none', color: view === 'kelola' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>⚙️ Kelola Data</button>
          )}
        </nav>
        {notificationPermission !== 'granted' && (
          <button onClick={requestNotifyPermission} style={{ marginBottom: '10px', fontSize: '11px', background: '#fefce8', border: '1px solid #fef08a', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#854d0e' }}>🔔 Aktifkan Notifikasi Perangkat</button>
        )}
        <button onClick={() => { setUser(null); setView('login'); }} style={{ background: '#fff1f2', border: 'none', color: '#e11d48', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>🚪 Keluar</button>
      </div>

      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* VIEW: JADWAL DESA */}
        {view === 'jadwal' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{margin: 0}}>Kalender & Jadwal Desa</h1>
                <p style={{color: '#64748b', marginTop: '4px'}}>Informasi kegiatan dan agenda resmi desa.</p>
              </div>
              {user.role === 'admin' && (
                <button onClick={() => setView('tambah_jadwal')} style={{ ...styles.btn, background: '#2563eb', color: 'white' }}>+ Buat Jadwal Baru</button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {schedules.length === 0 ? (
                <div style={{ padding: '80px 20px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                  <div style={{fontSize: '48px', marginBottom: '15px'}}>📅</div>
                  <h3 style={{color: '#1e293b', margin: '0 0 8px 0'}}>Belum Ada Agenda</h3>
                  <p style={{color: '#64748b', maxWidth: '400px', margin: '0 auto'}}>Saat ini belum ada jadwal kegiatan desa yang dipublikasikan.</p>
                </div>
              ) : schedules.map(s => (
                <div key={s.id} style={styles.schCard}>
                  <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '12px', textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>{s.date.split('-')[2]}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Bulan {s.date.split('-')[1]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{s.title}</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#64748b' }}>
                      <span>🕒 {s.time} WIB</span>
                      <span>📍 {s.location}</span>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#475569' }}>{s.description}</p>
                  </div>
                  {user.role === 'admin' && (
                    <button onClick={() => deleteSchedule(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: TAMBAH JADWAL (ADMIN ONLY) */}
        {view === 'tambah_jadwal' && user.role === 'admin' && (
          <div style={{ maxWidth: '600px' }}>
            <h1>Buat Agenda Baru</h1>
            <div style={{ ...styles.card(false), padding: '30px' }}>
              <form onSubmit={handleAddSchedule}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Nama Kegiatan</label>
                <input name="title" placeholder="Misal: Kerja Bakti Dusun" style={styles.input} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600' }}>Tanggal</label>
                    <input name="date" type="date" style={styles.input} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600' }}>Waktu</label>
                    <input name="time" type="time" style={styles.input} required />
                  </div>
                </div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Lokasi</label>
                <input name="location" placeholder="Misal: Aula Kantor Desa" style={styles.input} required />
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Keterangan Singkat</label>
                <textarea name="description" placeholder="Detail agenda..." style={{ ...styles.input, height: '80px' }} required />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setView('jadwal')} style={{ ...styles.btn, background: '#f1f5f9', flex: 1 }}>Batal</button>
                  <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', flex: 2 }}>Publikasikan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: DASHBOARD (BERANDA BERITA) */}
        {view === 'dashboard' && (
          <div>
            <h1 style={{ color: '#0f172a' }}>Kabar Digital Desa 4.0</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '20px' }}>
              {aspirations.length === 0 ? (
                <div style={{ padding: '40px', color: '#64748b' }}>Belum ada laporan atau pengumuman desa di beranda.</div>
              ) : aspirations.map(a => (
                <div key={a.id} id={`card-${a.id}`} style={styles.card(highlightId === a.id)}>
                  <div style={{ width: '100%', height: '220px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={a.lampiran || "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&w=800&q=80"} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      alt="lampiran" 
                    />
                  </div>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.badge(a.status)}>{a.status}</span>
                      <small style={{ color: '#94a3b8' }}>{a.nama}</small>
                    </div>
                    <h3 style={{ margin: '8px 0 4px', color: '#1e293b' }}>{a.judul}</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{a.deskripsi}</p>
                    {a.status === 'DITOLAK' && a.alasanAdmin && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                        <strong style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: '4px' }}>Alasan Penolakan Admin:</strong>
                        <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0, fontStyle: 'italic' }}>"{a.alasanAdmin}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: KELOLA ADMIN */}
        {view === 'kelola' && user.role === 'admin' && (
          <div>
            <h1 style={{ color: '#0f172a' }}>Panel Kendali Admin</h1>
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '16px' }}>Pelapor</th>
                    <th style={{ padding: '16px' }}>Detail</th>
                    <th style={{ padding: '16px' }}>Aksi Status</th>
                    <th style={{ padding: '16px' }}>Tampilan</th>
                  </tr>
                </thead>
                <tbody>
                  {aspirations.length === 0 ? (
                    <tr><td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Tidak ada data aspirasi masuk.</td></tr>
                  ) : aspirations.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 'bold' }}>{a.nama}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{a.id}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600' }}>{a.judul}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {a.status}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => gantiStatus(a.id, 'DIPROSES')} style={{ ...styles.btn, padding: '6px 10px', fontSize: '11px', background: '#fefce8', color: '#854d0e' }}>Proses</button>
                          <button onClick={() => gantiStatus(a.id, 'SELESAI')} style={{ ...styles.btn, padding: '6px 10px', fontSize: '11px', background: '#f0fdf4', color: '#166534' }}>Selesai</button>
                          <button onClick={() => gantiStatus(a.id, 'DITOLAK')} style={{ ...styles.btn, padding: '6px 10px', fontSize: '11px', background: '#fef2f2', color: '#991b1b' }}>Tolak</button>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button onClick={() => lihatDiBeranda(a.id)} style={{ ...styles.btn, padding: '8px 14px', fontSize: '12px', background: '#2563eb', color: 'white' }}>Lihat di Beranda</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: FORM ASPIRASI WARGA */}
        {view === 'form' && (
          <div style={{maxWidth: '600px'}}>
            <h1>Buat Aspirasi Baru</h1>
            <div style={{...styles.card(false), padding: '30px'}}>
              <form onSubmit={tambahAspirasi}>
                <label style={{fontSize: '14px', fontWeight: '600'}}>Judul Laporan</label>
                <input name="judul" placeholder="Contoh: Lampu Jalan Mati" style={styles.input} required/>
                <label style={{fontSize: '14px', fontWeight: '600'}}>Deskripsi Lengkap</label>
                <textarea name="deskripsi" placeholder="Jelaskan detail masalah..." style={{...styles.input, height: '120px'}} required/>
                <label style={{fontSize: '14px', fontWeight: '600'}}>Lampiran Foto (Opsional)</label>
                <input type="file" onChange={handleFileChange} style={{display: 'block', marginTop: '10px'}}/>
                <button type="submit" style={{...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '30px'}}>Kirim Laporan</button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: RIWAYAT WARGA */}
        {view === 'riwayat' && (
          <div>
            <h1>Laporanku</h1>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {aspirations.filter(x => x.nama === user.name).length === 0 ? <p>Anda belum pernah mengirim laporan.</p> : 
                aspirations.filter(x => x.nama === user.name).map(x => (
                  <div key={x.id} style={{...styles.card(false), padding: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <h4 style={{margin: 0}}>{x.judul}</h4>
                      <span style={styles.badge(x.status)}>{x.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* VIEW: CHAT WARGA */}
        {view === 'chat_grup' && (
          <div>
            <h1>Ruang Warga</h1>
            <div style={{height: '450px', background: 'white', borderRadius: '16px', padding: '20px', overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {globalMessages.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>Belum ada obrolan. Mari menyapa warga lain!</div>
              ) : globalMessages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === user.name ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', padding: '10px 16px', borderRadius: '14px' }}>
                    <small style={{display: 'block', fontWeight: 'bold', fontSize: '10px', marginBottom: '2px', opacity: 0.8}}>{m.sender}</small>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={kirimPesanGrup} style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tulis pesan..." style={styles.input}/>
              <button type="submit" style={{...styles.btn, background: '#2563eb', color: 'white'}}>Kirim</button>
            </form>
          </div>
        )}
      </div>

      {}
      {rejectModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...styles.card(false), width: '400px', padding: '30px' }}>
            <h3 style={{marginTop: 0, color: '#e11d48'}}>Tolak Laporan</h3>
            <textarea 
              style={{ ...styles.input, height: '100px' }} 
              placeholder="Berikan alasan penolakan..."
              value={rejectModal.reason} 
              onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setRejectModal({ show: false, aspirasiId: null, reason: '' })} style={{ ...styles.btn, background: '#f1f5f9', flex: 1 }}>Batal</button>
              <button onClick={submitPenolakan} style={{ ...styles.btn, background: '#e11d48', color: 'white', flex: 1 }}>Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}