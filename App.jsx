import React, { useState, useEffect } from 'react';

export default function App() {
  // --- STATE UTAMA (Inisialisasi dari LocalStorage) ---
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [tempFile, setTempFile] = useState(null); 
  const [highlightId, setHighlightId] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [rejectModal, setRejectModal] = useState({ show: false, aspirasiId: null, reason: '' });
  const [chatInput, setChatInput] = useState('');

  // Mengambil data awal dari LocalStorage saat pertama kali aplikasi dibuka
  const [globalMessages, setGlobalMessages] = useState(() => {
    const saved = localStorage.getItem('desa_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [aspirations, setAspirations] = useState(() => {
    const saved = localStorage.getItem('desa_aspirasi');
    return saved ? JSON.parse(saved) : [];
  });
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('desa_jadwal');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationPermission, setNotificationPermission] = useState('default');

  // --- LOGIKA PENYIMPANAN OTOMATIS KE LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('desa_chats', JSON.stringify(globalMessages));
  }, [globalMessages]);

  useEffect(() => {
    localStorage.setItem('desa_aspirasi', JSON.stringify(aspirations));
  }, [aspirations]);

  useEffect(() => {
    localStorage.setItem('desa_jadwal', JSON.stringify(schedules));
  }, [schedules]);

  // --- LOGIKA MASA BERLAKU DATA (Auto-Delete 30 Hari) ---
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

  // --- FUNGSI LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nama.value;
    const pass = e.target.password.value;
    if (pass === '123') { setUser({ name, role: 'warga' }); setView('dashboard'); }
    else if (pass === 'admin') { setUser({ name, role: 'admin' }); setView('dashboard'); }
    else { alert("Kredensial tidak valid."); }
  };

  // --- FUNGSI DATA ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setTempFile(reader.result);
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Ukuran foto terlalu besar (Maks 2MB).");
    }
  };

  const tambahAspirasi = (e) => {
    e.preventDefault();
    const baru = {
      id: "ID-" + Date.now(),
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

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const newSch = {
      id: "SCH-" + Date.now(),
      title: e.target.title.value,
      date: e.target.date.value,
      time: e.target.time.value,
      location: e.target.location.value,
      description: e.target.description.value,
      createdAt: Date.now()
    };
    setSchedules([newSch, ...schedules]);
    setView('jadwal');
  };

  const deleteSchedule = (id) => {
    if(confirm("Hapus jadwal ini?")) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
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

  const lihatDiBeranda = (id) => {
    setHighlightId(id);
    setView('dashboard');
    setIsSidebarOpen(false);
    setTimeout(() => {
      const element = document.getElementById(`card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  // --- STYLES RESPONSIF ---
  const styles = {
    card: (isHighlighted) => ({ 
      background: 'white', borderRadius: '16px', 
      boxShadow: isHighlighted ? '0 0 0 4px #2563eb' : '0 2px 4px rgba(0,0,0,0.05)', 
      overflow: 'hidden', border: isHighlighted ? '2px solid #2563eb' : '1px solid #e2e8f0',
      width: '100%', marginBottom: '15px', boxSizing: 'border-box'
    }),
    input: { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' },
    btn: { padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' },
    badge: (s) => ({
      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content',
      background: s === 'SELESAI' ? '#f0fdf4' : s === 'DIPROSES' ? '#fefce8' : s === 'DITOLAK' ? '#fef2f2' : '#f8fafc',
      color: s === 'SELESAI' ? '#166534' : s === 'DIPROSES' ? '#854d0e' : s === 'DITOLAK' ? '#991b1b' : '#64748b',
      border: `1px solid ${s === 'SELESAI' ? '#bbf7d0' : s === 'DIPROSES' ? '#fef08a' : s === 'DITOLAK' ? '#fecaca' : '#e2e8f0'}`
    }),
    schCard: { background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }
  };

  // --- VIEW: LOGIN ---
  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ ...styles.card(false), maxWidth: '380px', padding: '30px', textAlign: 'center' }}>
          <div style={{ background: '#2563eb', width: '60px', height: '60px', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>4.0</div>
          <h2 style={{ fontSize: '22px', margin: '0 0 10px 0' }}>Digital Desa 4.0</h2>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: '#f1f5f9', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#2563eb', color: 'white', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4.0</div>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Digital Desa</div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{ 
          position: 'absolute', top: 0, left: isSidebarOpen ? 0 : '-100%', 
          width: '280px', height: '100%', background: 'white', 
          zIndex: 105, transition: '0.3s ease', borderRight: '1px solid #e2e8f0', padding: '20px',
          boxSizing: 'border-box'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'dashboard' ? '#eff6ff' : 'none', color: view === 'dashboard' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>🏠 Beranda</button>
            <button onClick={() => { setView('jadwal'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'jadwal' ? '#eff6ff' : 'none', color: view === 'jadwal' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>📅 Jadwal Desa</button>
            <button onClick={() => { setView('chat_grup'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'chat_grup' ? '#eff6ff' : 'none', color: view === 'chat_grup' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>💬 Ruang Warga</button>
            {user.role === 'warga' && (
              <>
                <button onClick={() => { setView('form'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'form' ? '#eff6ff' : 'none', color: view === 'form' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>✍️ Buat Aspirasi</button>
                <button onClick={() => { setView('riwayat'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'riwayat' ? '#eff6ff' : 'none', color: view === 'riwayat' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>📋 Laporanku</button>
              </>
            )}
            {user.role === 'admin' && (
              <button onClick={() => { setView('kelola'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'kelola' ? '#eff6ff' : 'none', color: view === 'kelola' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>⚙️ Kelola Data</button>
            )}
            <button onClick={() => { setUser(null); setView('login'); }} style={{ marginTop: '20px', padding: '12px', color: '#ef4444', border: 'none', background: '#fef2f2', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>Keluar Sistem</button>
          </nav>
        </div>

        {/* OVERLAY MENU */}
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, marginTop: '60px' }}></div>}

        {/* AREA KONTEN */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', boxSizing: 'border-box', width: '100%' }}>
          
          {view === 'dashboard' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '22px', color: '#1e293b', marginBottom: '15px' }}>Kabar Desa</h2>
              {aspirations.length === 0 ? <p style={{color:'#64748b'}}>Belum ada informasi terbaru.</p> : aspirations.map(a => (
                <div key={a.id} id={`card-${a.id}`} style={styles.card(highlightId === a.id)}>
                  <img src={a.lampiran || "https://via.placeholder.com/800x400?text=Digital+Desa+4.0"} style={{ width: '100%', height: '200px', objectFit: 'cover' }} alt="img" />
                  <div style={{ padding: '15px' }}>
                    <span style={styles.badge(a.status)}>{a.status}</span>
                    <h3 style={{ margin: '10px 0 5px', fontSize: '18px' }}>{a.judul}</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{a.deskripsi}</p>
                    {a.status === 'DITOLAK' && a.alasanAdmin && (
                      <div style={{marginTop:'10px', background:'#fef2f2', padding:'10px', borderRadius:'8px', border:'1px solid #fecaca'}}>
                         <small style={{color:'#991b1b', fontWeight:'bold'}}>Alasan Ditolak:</small>
                         <p style={{margin:0, fontSize:'13px', color:'#b91c1c'}}>{a.alasanAdmin}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'jadwal' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', margin: 0 }}>Jadwal Desa</h2>
                {user.role === 'admin' && <button onClick={() => setView('tambah_jadwal')} style={{ ...styles.btn, background: '#2563eb', color: 'white' }}>+ Tambah</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {schedules.length === 0 ? <p>Belum ada jadwal kegiatan.</p> : schedules.map(s => (
                  <div key={s.id} style={styles.schCard}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px', textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{s.date.split('-')[2]}</div>
                      <div style={{ fontSize: '10px' }}>{s.date.split('-')[1]}</div>
                    </div>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: '0 0 4px 0'}}>{s.title}</h4>
                      <p style={{margin: 0, fontSize: '12px', color: '#64748b'}}>🕒 {s.time} | 📍 {s.location}</p>
                    </div>
                    {user.role === 'admin' && <button onClick={() => deleteSchedule(s.id)} style={{border:'none', background:'none', color:'#ef4444'}}>🗑️</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'chat_grup' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Ruang Warga</h2>
              <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '15px', overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalMessages.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8'}}>Belum ada obrolan.</p> : globalMessages.map(m => (
                  <div key={m.id} style={{ alignSelf: m.sender === user.name ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', padding: '10px', borderRadius: '12px', fontSize: '14px' }}>
                      <small style={{display: 'block', fontWeight: 'bold', fontSize: '10px', marginBottom: '2px'}}>{m.sender}</small>
                      {m.text}
                      <small style={{display:'block', textAlign:'right', fontSize:'9px', marginTop:'2px', opacity:0.7}}>{m.time}</small>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={kirimPesanGrup} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tulis..." style={{ ...styles.input, margin: 0 }} />
                <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white' }}>Kirim</button>
              </form>
            </div>
          )}

          {view === 'form' && (
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <h2>Buat Aspirasi</h2>
              <form onSubmit={tambahAspirasi} style={{ ...styles.card(false), padding: '20px' }}>
                <input name="judul" placeholder="Judul Laporan" style={styles.input} required />
                <textarea name="deskripsi" placeholder="Detail laporan..." style={{ ...styles.input, height: '120px' }} required />
                <input type="file" onChange={handleFileChange} style={{ margin: '15px 0', display: 'block' }} />
                <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%' }}>Kirim</button>
              </form>
            </div>
          )}

          {view === 'riwayat' && (
             <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2>Laporanku</h2>
                {aspirations.filter(a => a.nama === user.name).length === 0 ? <p>Belum ada laporan yang Anda kirim.</p> : 
                 aspirations.filter(a => a.nama === user.name).map(a => (
                   <div key={a.id} style={{...styles.card(false), padding:'15px', marginBottom:'10px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                         <h4 style={{margin:0}}>{a.judul}</h4>
                         <span style={styles.badge(a.status)}>{a.status}</span>
                      </div>
                      <p style={{fontSize:'13px', color:'#64748b', margin:'8px 0 0'}}>{a.deskripsi}</p>
                   </div>
                 ))
                }
             </div>
          )}

          {view === 'kelola' && user.role === 'admin' && (
            <div style={{ overflowX: 'auto', maxWidth: '800px', margin: '0 auto' }}>
              <h2>Kelola Data</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Warga</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {aspirations.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{a.nama}</td>
                      <td style={{ padding: '12px' }}>{a.status}</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '5px' }}>
                        <button onClick={() => gantiStatus(a.id, 'DIPROSES')} style={{fontSize:'12px', border:'none', background:'#fefce8', borderRadius:'4px', padding:'4px'}}>⏳</button>
                        <button onClick={() => gantiStatus(a.id, 'SELESAI')} style={{fontSize:'12px', border:'none', background:'#f0fdf4', borderRadius:'4px', padding:'4px'}}>✅</button>
                        <button onClick={() => gantiStatus(a.id, 'DITOLAK')} style={{fontSize:'12px', border:'none', background:'#fef2f2', borderRadius:'4px', padding:'4px'}}>❌</button>
                        <button onClick={() => lihatDiBeranda(a.id)} style={{fontSize:'12px', border:'none', background:'#eff6ff', borderRadius:'4px', padding:'4px'}}>👁️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {view === 'tambah_jadwal' && user.role === 'admin' && (
             <div style={{ maxWidth: '500px', margin: '0 auto' }}>
             <h2>Buat Jadwal Baru</h2>
             <form onSubmit={handleAddSchedule} style={{ ...styles.card(false), padding: '20px' }}>
               <input name="title" placeholder="Nama Kegiatan" style={styles.input} required />
               <input name="date" type="date" style={styles.input} required />
               <input name="time" type="time" style={styles.input} required />
               <input name="location" placeholder="Lokasi" style={styles.input} required />
               <textarea name="description" placeholder="Keterangan..." style={styles.input} />
               <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                  <button type="button" onClick={() => setView('jadwal')} style={{...styles.btn, background:'#f1f5f9', color:'#64748b', flex:1}}>Batal</button>
                  <button type="submit" style={{...styles.btn, background:'#2563eb', color:'white', flex:1}}>Simpan</button>
               </div>
             </form>
           </div>
          )}

        </div>
      </div>

      {/* MODAL PENOLAKAN */}
      {rejectModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...styles.card(false), maxWidth: '350px', padding: '20px' }}>
            <h4 style={{margin: '0 0 10px 0'}}>Alasan Penolakan</h4>
            <textarea style={styles.input} value={rejectModal.reason} onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})} placeholder="Tulis alasan..." />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectModal({ show: false, aspirasiId: null, reason: '' })} style={{...styles.btn, background:'#f1f5f9', color:'#64748b'}}>Batal</button>
              <button onClick={submitPenolakan} style={{ ...styles.btn, background: '#ef4444', color: 'white' }}>Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
