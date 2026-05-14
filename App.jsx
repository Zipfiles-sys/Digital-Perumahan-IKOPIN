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

  // --- AMBIL DATA DARI SUPABASE ---
  useEffect(() => {
    fetchInitialData();

    // Listener Real-time untuk Chat
    const chatSub = supabase.channel('room_chats').on('postgres_changes', { event: 'INSERT', table: 'desa_chats' }, fetchInitialData).subscribe();
    
    // Listener Real-time untuk Aspirasi
    const aspSub = supabase.channel('room_asp').on('postgres_changes', { event: '*', table: 'desa_aspirasi' }, fetchInitialData).subscribe();
    
    // Listener Real-time untuk Jadwal
    const schSub = supabase.channel('room_sch').on('postgres_changes', { event: '*', table: 'desa_jadwal' }, fetchInitialData).subscribe();

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

  // --- LOGIKA LOGIN & LOGOUT ---
  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nama.value;
    const pass = e.target.password.value;
    if (pass === '123') { setUser({ name, role: 'warga' }); setView('dashboard'); }
    else if (pass === 'admin') { setUser({ name, role: 'admin' }); setView('dashboard'); }
    else alert("Kata sandi salah!");
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setIsSidebarOpen(false);
  };

  // --- FITUR CHAT ---
  const kirimPesanGrup = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await supabase.from('desa_chats').insert([{ sender: user.name, text: chatInput }]);
    setChatInput('');
  };

  // --- FITUR ASPIRASI ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File terlalu besar (Maks 2MB)");
      const reader = new FileReader();
      reader.onloadend = () => setTempFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const tambahAspirasi = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('desa_aspirasi').insert([{ 
      nama: user.name, 
      judul: e.target.judul.value, 
      deskripsi: e.target.deskripsi.value,
      status: 'DIKIRIM',
      lampiran: tempFile
    }]);
    if (!error) {
      alert("Aspirasi terkirim!");
      setTempFile(null);
      setView('dashboard');
    }
  };

  const updateStatusAspirasi = async (id, status, alasan = null) => {
    await supabase.from('desa_aspirasi').update({ status, alasan_admin: alasan }).eq('id', id);
    setRejectModal({ show: false, aspirasiId: null, reason: '' });
  };

  // --- FITUR JADWAL ---
  const tambahJadwal = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('desa_jadwal').insert([{
      title: e.target.title.value,
      date: e.target.date.value,
      time: e.target.time.value,
      location: e.target.location.value,
      description: e.target.description.value
    }]);
    if (!error) {
      alert("Jadwal baru berhasil dipublikasikan!");
      setView('jadwal');
    }
  };

  const hapusJadwal = async (id) => {
    if (window.confirm("Hapus jadwal ini?")) {
      await supabase.from('desa_jadwal').delete().eq('id', id);
    }
  };

  // --- STYLES ---
  const styles = {
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', padding: '15px' },
    input: { width: '100%', padding: '10px', margin: '8px 0', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
    btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    badge: (s) => ({
      padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold',
      background: s === 'SELESAI' ? '#dcfce7' : s === 'DIPROSES' ? '#fef9c3' : s === 'DITOLAK' ? '#fee2e2' : '#f1f5f9',
      color: s === 'SELESAI' ? '#166534' : s === 'DIPROSES' ? '#854d0e' : s === 'DITOLAK' ? '#991b1b' : '#475569'
    })
  };

  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ ...styles.card, width: '320px', textAlign: 'center' }}>
          <h2 style={{ color: '#2563eb' }}>Digital Desa 4.0</h2>
          <form onSubmit={handleLogin}>
            <input name="nama" placeholder="Nama Lengkap" style={styles.input} required />
            <input name="password" type="password" placeholder="Kata Sandi" style={styles.input} required />
            <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 'bold', color: '#2563eb' }}>Digital Desa 4.0</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '6px' }}>
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar Navigasi */}
        <div style={{ 
          position: 'absolute', left: isSidebarOpen ? 0 : '-260px', top: 0, width: '250px', height: '100%', 
          background: 'white', borderRight: '1px solid #e2e8f0', padding: '15px', zIndex: 100, transition: '0.3s ease' 
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>🏠 Beranda</button>
            <button onClick={() => { setView('jadwal'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>📅 Jadwal Desa</button>
            <button onClick={() => { setView('chat_grup'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>💬 Ruang Warga</button>
            {user.role === 'warga' && <button onClick={() => { setView('form'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>✍️ Buat Aspirasi</button>}
            {user.role === 'admin' && (
              <>
                <button onClick={() => { setView('kelola_aspirasi'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>⚙️ Kelola Aspirasi</button>
                <button onClick={() => { setView('tambah_jadwal'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', background: 'none', border: 'none', fontWeight: 'bold' }}>➕ Buat Jadwal</button>
              </>
            )}
            <button onClick={handleLogout} style={{ textAlign: 'left', padding: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '8px', marginTop: '20px', fontWeight: 'bold' }}>🚪 Keluar</button>
          </nav>
        </div>

        <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {/* DASHBOARD ASPIRASI */}
          {view === 'dashboard' && (
            <div>
              <h3>Kabar Aspirasi Warga</h3>
              {aspirations.map(a => (
                <div key={a.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={styles.badge(a.status)}>{a.status}</span>
                    <small>{new Date(a.created_at).toLocaleDateString()}</small>
                  </div>
                  <h4 style={{ margin: '10px 0 5px' }}>{a.judul}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>{a.deskripsi}</p>
                  {a.lampiran && <img src={a.lampiran} style={{ width: '100%', borderRadius: '8px', marginTop: '10px', maxHeight: '200px', objectFit: 'cover' }} />}
                  {a.alasan_admin && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fee2e2', borderRadius: '8px', fontSize: '12px', color: '#991b1b' }}>
                      <strong>Alasan Admin:</strong> {a.alasan_admin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* JADWAL DESA */}
          {view === 'jadwal' && (
            <div>
              <h3>Agenda Kegiatan Desa</h3>
              {schedules.length === 0 && <p>Belum ada jadwal kegiatan.</p>}
              {schedules.map(s => (
                <div key={s.id} style={styles.card}>
                  <div style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '14px' }}>{s.date} | {s.time} WIB</div>
                  <h4 style={{ margin: '8px 0' }}>{s.title}</h4>
                  <p style={{ fontSize: '13px', margin: '2px 0' }}>📍 <strong>Lokasi:</strong> {s.location}</p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>{s.description}</p>
                  {user.role === 'admin' && (
                    <button onClick={() => hapusJadwal(s.id)} style={{ color: '#ef4444', border: 'none', background: 'none', padding: 0, marginTop: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🗑 Hapus Jadwal</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CHAT GRUP */}
          {view === 'chat_grup' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '15px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                {globalMessages.map(m => (
                  <div key={m.id} style={{ textAlign: m.sender === user.name ? 'right' : 'left', marginBottom: '10px' }}>
                    <div style={{ display: 'inline-block', padding: '10px 14px', borderRadius: '15px', background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', fontSize: '14px' }}>
                      <small style={{ display: 'block', fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>{m.sender}</small>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={kirimPesanGrup} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tulis pesan..." style={{ ...styles.input, margin: 0 }} />
                <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white' }}>Kirim</button>
              </form>
            </div>
          )}

          {/* FORM ASPIRASI (WARGA) */}
          {view === 'form' && (
            <div style={styles.card}>
              <h3>Buat Aspirasi Baru</h3>
              <form onSubmit={tambahAspirasi}>
                <input name="judul" placeholder="Judul Aspirasi" style={styles.input} required />
                <textarea name="deskripsi" placeholder="Jelaskan aspirasi Anda..." style={{ ...styles.input, height: '120px' }} required />
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Unggah Foto (Maks 2MB):</label>
                <input type="file" onChange={handleFileChange} accept="image/*" style={styles.input} />
                {tempFile && <img src={tempFile} style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />}
                <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%' }}>Kirim Sekarang</button>
              </form>
            </div>
          )}

          {/* KELOLA ASPIRASI (ADMIN) */}
          {view === 'kelola_aspirasi' && (
            <div>
              <h3>Manajemen Aspirasi</h3>
              {aspirations.map(a => (
                <div key={a.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{a.nama}</strong>
                    <span style={styles.badge(a.status)}>{a.status}</span>
                  </div>
                  <h4 style={{ margin: '10px 0' }}>{a.judul}</h4>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatusAspirasi(a.id, 'DIBACA')} style={{ ...styles.btn, fontSize: '11px', background: '#f1f5f9' }}>DIBACA</button>
                    <button onClick={() => updateStatusAspirasi(a.id, 'DIPROSES')} style={{ ...styles.btn, fontSize: '11px', background: '#fef9c3' }}>PROSES</button>
                    <button onClick={() => updateStatusAspirasi(a.id, 'SELESAI')} style={{ ...styles.btn, fontSize: '11px', background: '#dcfce7' }}>SELESAI</button>
                    <button onClick={() => setRejectModal({ show: true, aspirasiId: a.id, reason: '' })} style={{ ...styles.btn, fontSize: '11px', background: '#fee2e2', color: '#991b1b' }}>TOLAK</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUAT JADWAL (ADMIN) */}
          {view === 'tambah_jadwal' && (
            <div style={styles.card}>
              <h3>Buat Agenda Baru</h3>
              <form onSubmit={tambahJadwal}>
                <input name="title" placeholder="Nama Kegiatan" style={styles.input} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input name="date" type="date" style={styles.input} required />
                  <input name="time" type="time" style={styles.input} required />
                </div>
                <input name="location" placeholder="Lokasi Kegiatan" style={styles.input} required />
                <textarea name="description" placeholder="Keterangan tambahan..." style={{ ...styles.input, height: '100px' }} />
                <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: 'white', width: '100%' }}>Publikasikan Jadwal</button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL ALASAN PENOLAKAN (ADMIN) */}
      {rejectModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...styles.card, width: '100%', maxWidth: '350px' }}>
            <h4 style={{ marginTop: 0 }}>Alasan Penolakan</h4>
            <textarea 
              style={{ ...styles.input, height: '100px' }} 
              placeholder="Jelaskan alasan laporan ditolak..."
              value={rejectModal.reason} 
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectModal({ show: false, aspirasiId: null, reason: '' })} style={{ ...styles.btn, flex: 1, background: '#f1f5f9' }}>Batal</button>
              <button onClick={() => updateStatusAspirasi(rejectModal.aspirasiId, 'DITOLAK', rejectModal.reason)} style={{ ...styles.btn, flex: 1, background: '#ef4444', color: 'white' }}>Kirim Alasan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
