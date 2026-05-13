import React, { useState, useEffect } from 'react';

export default function App() {
  // --- STATE UTAMA ---
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [tempFile, setTempFile] = useState(null); 
  const [highlightId, setHighlightId] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk navigasi HP
  
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

  // --- STYLES (Update for Responsiveness) ---
  const styles = {
    card: (isHighlighted) => ({ 
      background: 'white', 
      borderRadius: '16px', 
      boxShadow: isHighlighted ? '0 0 0 4px #2563eb' : '0 4px 6px -1px rgba(0,0,0,0.05)', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'all 0.4s ease',
      border: isHighlighted ? '2px solid #2563eb' : '1px solid #e2e8f0',
      width: '100%'
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
      flexWrap: 'wrap',
      gap: '15px',
      alignItems: 'center'
    }
  };

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ ...styles.card(false), maxWidth: '380px', padding: '40px', textAlign: 'center' }}>
          <div style={{ background: '#2563eb', width: '60px', height: '60px', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>4.0</div>
          <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Digital Desa 4.0</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Masuk untuk mengakses layanan warga.</p>
          <form onSubmit={handleLogin}>
            <input name="nama" placeholder="Nama Lengkap" style={styles.input} required />
            <input name="password" type="password" placeholder="Kata Sandi" style={styles.input} required />
            <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '10px' }}>Masuk Sistem</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f1f5f9' }}>
      
      {/* Header Mobile & Tablet */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#2563eb', color: 'white', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>4.0</div>
          <h2 style={{ fontSize: '16px', margin: 0, color: '#1e293b' }}>Digital Desa</h2>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '18px' }}>
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Main Layout Wrap */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Sidebar Overlay (Mobile Only) */}
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 90 }}></div>
        )}

        {/* Sidebar */}
        <div style={{ 
          width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', 
          display: 'flex', flexDirection: 'column',
          position: 'absolute', top: 0, left: isSidebarOpen ? 0 : '-280px', bottom: 0,
          zIndex: 101, transition: 'left 0.3s ease-in-out',
          height: 'calc(100vh - 60px)'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} style={{ background: view === 'dashboard' ? '#f1f5f9' : 'none', border: 'none', color: view === 'dashboard' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>🏠 Beranda</button>
            <button onClick={() => { setView('jadwal'); setIsSidebarOpen(false); }} style={{ background: view === 'jadwal' ? '#f1f5f9' : 'none', border: 'none', color: view === 'jadwal' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>📅 Jadwal Desa</button>
            <button onClick={() => { setView('chat_grup'); setIsSidebarOpen(false); }} style={{ background: view === 'chat_grup' ? '#f1f5f9' : 'none', border: 'none', color: view === 'chat_grup' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>💬 Ruang Warga</button>
            {user.role === 'warga' && (
              <>
                <button onClick={() => { setView('form'); setIsSidebarOpen(false); }} style={{ background: view === 'form' ? '#f1f5f9' : 'none', border: 'none', color: view === 'form' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>✍️ Buat Aspirasi</button>
                <button onClick={() => { setView('riwayat'); setIsSidebarOpen(false); }} style={{ background: view === 'riwayat' ? '#f1f5f9' : 'none', border: 'none', color: view === 'riwayat' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>📋 Laporanku</button>
              </>
            )}
            {user.role === 'admin' && (
              <button onClick={() => { setView('kelola'); setIsSidebarOpen(false); }} style={{ background: view === 'kelola' ? '#f1f5f9' : 'none', border: 'none', color: view === 'kelola' ? '#2563eb' : '#64748b', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600' }}>⚙️ Kelola Data</button>
            )}
          </nav>
          <button onClick={() => { setUser(null); setView('login'); }} style={{ background: '#fff1f2', border: 'none', color: '#e11d48', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', fontWeight: '600', marginTop: '20px' }}>🚪 Keluar</button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          
          {/* VIEW: JADWAL DESA */}
          {view === 'jadwal' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                <h1 style={{margin: 0, fontSize: '22px'}}>Kalender Desa</h1>
                {user.role === 'admin' && (
                  <button onClick={() => setView('tambah_jadwal')} style={{ ...styles.btn, background: '#2563eb', color: 'white', width: 'fit-content' }}>+ Buat Jadwal</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {schedules.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                    <p style={{color: '#64748b'}}>Belum ada agenda desa.</p>
                  </div>
                ) : schedules.map(s => (
                  <div key={s.id} style={styles.schCard}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px', textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{s.date.split('-')[2]}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Bulan {s.date.split('-')[1]}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{s.title}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>🕒 {s.time} | 📍 {s.location}</p>
                    </div>
                    {user.role === 'admin' && (
                      <button onClick={() => deleteSchedule(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {view === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Kabar Desa</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {aspirations.length === 0 ? (
                  <p style={{color: '#64748b'}}>Belum ada kabar terbaru.</p>
                ) : aspirations.map(a => (
                  <div key={a.id} id={`card-${a.id}`} style={styles.card(highlightId === a.id)}>
                    <div style={{ width: '100%', height: '180px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={a.lampiran || "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=400"} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="img" />
                    </div>
                    <div style={{ padding: '15px' }}>
                      <span style={styles.badge(a.status)}>{a.status}</span>
                      <h4 style={{ margin: '10px 0 5px' }}>{a.judul}</h4>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>{a.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CHAT GRUP */}
          {view === 'chat_grup' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
              <h2 style={{fontSize: '20px'}}>Ruang Warga</h2>
              <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '15px', overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalMessages.map(m => (
                  <div key={m.id} style={{ alignSelf: m.sender === user.name ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', padding: '10px', borderRadius: '12px', fontSize: '14px' }}>
                      <small style={{display: 'block', fontWeight: 'bold', fontSize: '10px', opacity: 0.8}}>{m.sender}</small>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={kirimPesanGrup} style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tulis..." style={{...styles.input, margin: 0}}/>
                <button type="submit" style={{...styles.btn, background: '#2563eb', color: 'white'}}>Kirim</button>
              </form>
            </div>
          )}

          {/* VIEW: FORM ASPIRASI */}
          {view === 'form' && (
            <div style={{maxWidth: '100%'}}>
              <h2>Buat Aspirasi</h2>
              <div style={{...styles.card(false), padding: '20px'}}>
                <form onSubmit={tambahAspirasi}>
                  <input name="judul" placeholder="Judul Laporan" style={styles.input} required/>
                  <textarea name="deskripsi" placeholder="Deskripsi..." style={{...styles.input, height: '100px'}} required/>
                  <input type="file" onChange={handleFileChange} style={{display: 'block', margin: '10px 0'}}/>
                  <button type="submit" style={{...styles.btn, background: '#2563eb', color: 'white', width: '100%'}}>Kirim</button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: KELOLA DATA (ADMIN) */}
          {view === 'kelola' && user.role === 'admin' && (
            <div style={{ overflowX: 'auto' }}>
              <h2>Kelola Data</h2>
              <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', background: 'white', borderRadius: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px' }}>Warga</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {aspirations.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{a.nama}</td>
                      <td style={{ padding: '10px' }}>{a.status}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                        <button onClick={() => gantiStatus(a.id, 'DIPROSES')} style={{fontSize: '10px', padding: '5px'}}>⏳</button>
                        <button onClick={() => gantiStatus(a.id, 'SELESAI')} style={{fontSize: '10px', padding: '5px'}}>✅</button>
                        <button onClick={() => gantiStatus(a.id, 'DITOLAK')} style={{fontSize: '10px', padding: '5px'}}>❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Lanjutan View Tambah Jadwal, Riwayat, dll sesuai logika asli */}
          {view === 'tambah_jadwal' && (
            <div style={{maxWidth: '100%'}}>
              <h2>Tambah Jadwal</h2>
              <form onSubmit={handleAddSchedule} style={{...styles.card(false), padding: '20px'}}>
                <input name="title" placeholder="Nama Kegiatan" style={styles.input} required/>
                <input name="date" type="date" style={styles.input} required/>
                <input name="time" type="time" style={styles.input} required/>
                <input name="location" placeholder="Lokasi" style={styles.input} required/>
                <textarea name="description" placeholder="Keterangan..." style={styles.input}/>
                <button type="submit" style={{...styles.btn, background: '#2563eb', color: 'white', width: '100%'}}>Simpan</button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Modal Penolakan */}
      {rejectModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...styles.card(false), maxWidth: '350px', padding: '20px' }}>
            <h4 style={{margin: '0 0 10px 0'}}>Alasan Penolakan</h4>
            <textarea style={styles.input} value={rejectModal.reason} onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}/>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectModal({ show: false, aspirasiId: null, reason: '' })} style={styles.btn}>Batal</button>
              <button onClick={submitPenolakan} style={{ ...styles.btn, background: '#ef4444', color: 'white' }}>Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
