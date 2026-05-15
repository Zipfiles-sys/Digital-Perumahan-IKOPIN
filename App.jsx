import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI DATABASE ONLINE ---
const SUPABASE_URL = 'https://zubjpbyaivbbbksevxhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YmpwYnlhaXZiYmJrc2V2eGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjA0NDAsImV4cCI6MjA5NDI5NjQ0MH0.BZ8itmIvXof6Bt6pdS9hHTzfjOsB9jMiU5ZffoWama8'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [tempFile, setTempFile] = useState(null);
  
  const [globalMessages, setGlobalMessages] = useState([]);
  const [aspirations, setAspirations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rejectModal, setRejectModal] = useState({ show: false, aspirasiId: null, reason: '' });

  // --- AMBIL DATA DENGAN SISTEM REAL-TIME YANG DIPERBAIKI ---
  useEffect(() => {
    fetchInitialData();

    // Listener Chat Real-time (Pesan langsung muncul tanpa refresh)
    const chatSub = supabase
      .channel('room_chats')
      .on('postgres_changes', { event: 'INSERT', table: 'desa_chats' }, (payload) => {
        setGlobalMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    // Listener Aspirasi Real-time
    const aspSub = supabase
      .channel('room_asp')
      .on('postgres_changes', { event: '*', table: 'desa_aspirasi' }, () => {
        fetchInitialData();
      })
      .subscribe();

    // Listener Jadwal Real-time
    const schSub = supabase
      .channel('room_sch')
      .on('postgres_changes', { event: '*', table: 'desa_jadwal' }, () => {
        fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(aspSub);
      supabase.removeChannel(schSub);
    };
  }, []);

  async function fetchInitialData() {
    const { data: chats } = await supabase.from('desa_chats').select('*').order('created_at', { ascending: true });
    if (chats) setGlobalMessages(chats);
    const { data: aspi } = await supabase.from('desa_aspirasi').select('*').order('created_at', { ascending: false });
    if (aspi) setAspirations(aspi);
    const { data: sch } = await supabase.from('desa_jadwal').select('*').order('date', { ascending: true });
    if (sch) setSchedules(sch);
  }

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nama.value;
    const pass = e.target.password.value;
    if (pass === '123') { setUser({ name, role: 'warga' }); setView('dashboard'); }
    else if (pass === 'admin') { setUser({ name, role: 'admin' }); setView('dashboard'); }
    else alert("Kata sandi salah!");
  };

  const handleLogout = () => { setUser(null); setView('login'); setIsSidebarOpen(false); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setTempFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const tambahAspirasi = async (e) => {
    e.preventDefault();
    await supabase.from('desa_aspirasi').insert([{ nama: user.name, judul: e.target.judul.value, deskripsi: e.target.deskripsi.value, status: 'DIKIRIM', lampiran: tempFile }]);
    alert("Aspirasi terkirim!"); setTempFile(null); setView('dashboard');
  };

  const tambahJadwal = async (e) => {
    e.preventDefault();
    await supabase.from('desa_jadwal').insert([{ title: e.target.title.value, date: e.target.date.value, time: e.target.time.value, location: e.target.location.value, description: e.target.description.value }]);
    alert("Jadwal dipublikasikan!"); setView('jadwal');
  };

  const updateStatusAspirasi = async (id, status, alasan = null) => {
    await supabase.from('desa_aspirasi').update({ status, alasan_admin: alasan }).eq('id', id);
    setRejectModal({ show: false, aspirasiId: null, reason: '' });
  };

  const styles = {
    card: { background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    input: { width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
    btn: { padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    badge: (s) => ({
      padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block',
      background: s === 'SELESAI' ? '#dcfce7' : s === 'DIPROSES' ? '#fef9c3' : s === 'DITOLAK' ? '#fee2e2' : '#f1f5f9',
      color: s === 'SELESAI' ? '#166534' : s === 'DIPROSES' ? '#854d0e' : s === 'DITOLAK' ? '#991b1b' : '#475569'
    })
  };

  if (view === 'login') return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '350px', textAlign: 'center' }}>
        <h2 style={{ color: '#2563eb', marginBottom: '25px' }}>Digital Desa 4.0</h2>
        <form onSubmit={handleLogin}>
          <input name="nama" placeholder="Nama Lengkap" style={styles.input} required />
          <input name="password" type="password" placeholder="Kata Sandi" style={styles.input} required />
          <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '10px' }}>Masuk Sistem</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 1000 }}>
        <div style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '18px' }}>Digital Desa 4.0</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold' }}>MENU</button>
      </header>

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: 0, left: isSidebarOpen ? 0 : '-100%', width: '280px', height: '100%', 
          background: 'white', zIndex: 999, transition: '0.3s ease', borderRight: '1px solid #e2e8f0', padding: '20px', boxSizing: 'border-box'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'dashboard' ? '#eff6ff' : 'none', color: view === 'dashboard' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>🏠 Beranda</button>
            <button onClick={() => { setView('jadwal'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'jadwal' ? '#eff6ff' : 'none', color: view === 'jadwal' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>📅 Jadwal Desa</button>
            <button onClick={() => { setView('chat_grup'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'chat_grup' ? '#eff6ff' : 'none', color: view === 'chat_grup' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>💬 Ruang Warga</button>
            {user.role === 'warga' && <button onClick={() => { setView('form'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'form' ? '#eff6ff' : 'none', color: view === 'form' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>✍️ Buat Aspirasi</button>}
            {user.role === 'admin' && (
              <>
                <hr style={{ border: '0.5px solid #f1f5f9' }} />
                <button onClick={() => { setView('kelola_aspirasi'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'kelola_aspirasi' ? '#eff6ff' : 'none', color: view === 'kelola_aspirasi' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>⚙️ Kelola Aspirasi</button>
                <button onClick={() => { setView('tambah_jadwal'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '15px', border: 'none', background: view === 'tambah_jadwal' ? '#eff6ff' : 'none', color: view === 'tambah_jadwal' ? '#2563eb' : '#64748b', borderRadius: '10px', fontWeight: 'bold' }}>➕ Buat Jadwal</button>
              </>
            )}
            <button onClick={handleLogout} style={{ marginTop: '20px', padding: '15px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>🚪 Keluar</button>
          </nav>
        </div>

        <main style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '700px' }}>
            
            {view === 'dashboard' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>📢 Kabar Aspirasi Warga</h3>
                {aspirations.map(a => (
                  <div key={a.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={styles.badge(a.status)}>{a.status}</span>
                      <small style={{ color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString()}</small>
                    </div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{a.judul}</h4>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>{a.deskripsi}</p>
                    {a.lampiran && <img src={a.lampiran} style={{ width: '100%', borderRadius: '12px', marginTop: '15px', maxHeight: '300px', objectFit: 'cover' }} />}
                    {a.alasan_admin && (
                      <div style={{ marginTop: '15px', padding: '12px', background: '#fff1f2', borderRadius: '10px', fontSize: '13px', color: '#be123c', border: '1px solid #fecaca' }}>
                        <strong>Catatan Admin:</strong> {a.alasan_admin}
                      </div>
                    )}
                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>Dilaporkan oleh: <strong>{a.nama}</strong></div>
                  </div>
                ))}
              </div>
            )}

            {view === 'jadwal' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>📅 Agenda Kegiatan Desa</h3>
                {schedules.length === 0 ? <p style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Belum ada jadwal kegiatan.</p> : 
                  schedules.map(s => (
                  <div key={s.id} style={styles.card}>
                    <div style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{s.date} | {s.time} WIB</div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{s.title}</h4>
                    <div style={{ fontSize: '14px', color: '#475569' }}>📍 <strong>Lokasi:</strong> {s.location}</div>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>{s.description}</p>
                    {user.role === 'admin' && (
                      <button onClick={async () => { if(window.confirm("Hapus?")) await supabase.from('desa_jadwal').delete().eq('id', s.id); fetchInitialData(); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '15px', fontSize: '12px', fontWeight: 'bold' }}>🗑️ Hapus Jadwal</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {view === 'chat_grup' && (
              <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: 'white', borderRadius: '15px', padding: '15px', overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {globalMessages.map(m => (
                    <div key={m.id} style={{ textAlign: m.sender === user.name ? 'right' : 'left' }}>
                      <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '15px', background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', fontSize: '14px' }}>
                        <small style={{ display: 'block', fontWeight: 'bold', fontSize: '10px', marginBottom: '3px' }}>{m.sender}</small>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={async (e) => { e.preventDefault(); if(!chatInput.trim()) return; await supabase.from('desa_chats').insert([{ sender: user.name, text: chatInput }]); setChatInput(''); }} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ketik pesan..." style={{ ...styles.input, margin: 0 }} />
                  <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white' }}>Kirim</button>
                </form>
              </div>
            )}

            {view === 'form' && (
              <div style={styles.card}>
                <h3 style={{ marginBottom: '20px' }}>✍️ Buat Aspirasi Baru</h3>
                <form onSubmit={tambahAspirasi}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Judul Laporan</label>
                  <input name="judul" placeholder="Contoh: Lampu Jalan Mati" style={styles.input} required />
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Detail Masalah</label>
                  <textarea name="deskripsi" placeholder="Ceritakan detail lokasinya" style={{ ...styles.input, height: '120px' }} required />
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Unggah Foto Bukti (Opsional)</label>
                  <input type="file" onChange={handleFileChange} accept="image/*" style={styles.input} />
                  {tempFile && <img src={tempFile} style={{ width: '100%', borderRadius: '10px', margin: '15px 0' }} />}
                  <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '10px' }}>Kirim Aspirasi Sekarang</button>
                </form>
              </div>
            )}

            {view === 'kelola_aspirasi' && user.role === 'admin' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>⚙️ Manajemen Aspirasi Warga</h3>
                {aspirations.map(a => (
                  <div key={a.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>{a.nama}</strong>
                      <span style={styles.badge(a.status)}>{a.status}</span>
                    </div>
                    <p style={{ fontSize: '14px', marginBottom: '15px' }}>{a.judul}</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => updateStatusAspirasi(a.id, 'DIBACA')} style={{ ...styles.btn, fontSize: '11px', background: '#f1f5f9', flex: 1 }}>DIBACA</button>
                      <button onClick={() => updateStatusAspirasi(a.id, 'DIPROSES')} style={{ ...styles.btn, fontSize: '11px', background: '#fef9c3', flex: 1 }}>PROSES</button>
                      <button onClick={() => updateStatusAspirasi(a.id, 'SELESAI')} style={{ ...styles.btn, fontSize: '11px', background: '#dcfce7', flex: 1 }}>SELESAI</button>
                      <button onClick={() => setRejectModal({ show: true, aspirasiId: a.id, reason: '' })} style={{ ...styles.btn, fontSize: '11px', background: '#fee2e2', color: '#991b1b', flex: 1 }}>TOLAK</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'tambah_jadwal' && user.role === 'admin' && (
              <div style={styles.card}>
                <h3 style={{ marginBottom: '20px' }}>➕ Buat Agenda Desa Baru</h3>
                <form onSubmit={tambahJadwal}>
                  <input name="title" placeholder="Nama Kegiatan" style={styles.input} required />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input name="date" type="date" style={styles.input} required />
                    <input name="time" type="time" style={styles.input} required />
                  </div>
                  <input name="location" placeholder="Lokasi (Misal: Balai Desa)" style={styles.input} required />
                  <textarea name="description" placeholder="Keterangan tambahan..." style={{ ...styles.input, height: '80px' }} />
                  <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%', marginTop: '10px' }}>Publikasikan Jadwal</button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {rejectModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ ...styles.card, width: '100%', maxWidth: '350px', margin: 0 }}>
            <h4 style={{ marginTop: 0 }}>Tolak Aspirasi</h4>
            <textarea style={styles.input} value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} placeholder="Tulis alasan penolakan..." />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectModal({ show: false, aspirasiId: null, reason: '' })} style={{ ...styles.btn, flex: 1, background: '#f1f5f9' }}>Batal</button>
              <button onClick={() => updateStatusAspirasi(rejectModal.aspirasiId, 'DITOLAK', rejectModal.reason)} style={{ ...styles.btn, background: '#ef4444', color: 'white', flex: 1 }}>Kirim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
