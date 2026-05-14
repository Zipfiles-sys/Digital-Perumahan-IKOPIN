import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI DATABASE ONLINE ---
const SUPABASE_URL = 'https://zubjpbyaivbbbksevxhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YmpwYnlhaXZiYmJrc2V2eGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjA0NDAsImV4cCI6MjA5NDI5NjQ0MH0.BZ8itmIvXof6Bt6pdS9hHTzfjOsB9jMiU5ZffoWama8'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // --- STATE UTAMA ---
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [tempFile, setTempFile] = useState(null);
  
  const [globalMessages, setGlobalMessages] = useState([]);
  const [aspirations, setAspirations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rejectModal, setRejectModal] = useState({ show: false, aspirasiId: null, reason: '' });

  // --- AMBIL DATA DARI SUPABASE (SINKRONISASI) ---
  useEffect(() => {
    fetchInitialData();

    // Fitur Real-time: Chat otomatis muncul di device lain tanpa refresh
    const chatSubscription = supabase
      .channel('room_warga')
      .on('postgres_changes', { event: 'INSERT', table: 'desa_chats' }, (payload) => {
        setGlobalMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, []);

  async function fetchInitialData() {
    // Ambil Chat
    const { data: chats } = await supabase.from('desa_chats').select('*').order('created_at', { ascending: true });
    if (chats) setGlobalMessages(chats);

    // Ambil Aspirasi
    const { data: aspi } = await supabase.from('desa_aspirasi').select('*').order('created_at', { ascending: false });
    if (aspi) setAspirations(aspi);
  }

  // --- FUNGSI LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nama.value;
    const pass = e.target.password.value;
    if (pass === '123') { setUser({ name, role: 'warga' }); setView('dashboard'); }
    else if (pass === 'admin') { setUser({ name, role: 'admin' }); setView('dashboard'); }
    else { alert("Kata sandi salah!"); }
  };

  // --- FUNGSI KIRIM PESAN (DATABASE) ---
  const kirimPesanGrup = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { error } = await supabase.from('desa_chats').insert([
      { sender: user.name, text: chatInput }
    ]);

    if (!error) setChatInput('');
  };

  // --- FUNGSI ASPIRASI (DATABASE) ---
  const tambahAspirasi = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('desa_aspirasi').insert([
      { 
        nama: user.name, 
        judul: e.target.judul.value, 
        deskripsi: e.target.deskripsi.value,
        status: 'DIKIRIM'
      }
    ]);

    if (!error) {
      alert("Aspirasi berhasil dikirim ke server!");
      fetchInitialData();
      setView('dashboard');
    }
  };

  // --- STYLES ---
  const styles = {
    card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '15px', overflow: 'hidden' },
    input: { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' },
    btn: { padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', background: '#2563eb', color: 'white' }
  };

  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ ...styles.card, maxWidth: '380px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#2563eb', width: '50px', height: '50px', borderRadius: '12px', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>4.0</div>
          <h2>Digital Desa 4.0</h2>
          <form onSubmit={handleLogin}>
            <input name="nama" placeholder="Nama Lengkap" style={styles.input} required />
            <input name="password" type="password" placeholder="Kata Sandi" style={styles.input} required />
            <button type="submit" style={{ ...styles.btn, width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: '#f1f5f9' }}>
      
      {/* Header Mobile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 110 }}>
        <div style={{ fontWeight: 'bold', color: '#2563eb' }}>Digital Desa 4.0</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 12px' }}>
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        
        {/* Sidebar Navigasi */}
        <div style={{ 
          position: 'absolute', top: 0, left: isSidebarOpen ? 0 : '-100%', 
          width: '280px', height: '100%', background: 'white', 
          zIndex: 105, transition: '0.3s ease', borderRight: '1px solid #e2e8f0', padding: '20px', boxSizing: 'border-box' 
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'dashboard' ? '#eff6ff' : 'none', color: view === 'dashboard' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>🏠 Beranda</button>
            <button onClick={() => { setView('chat_grup'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'chat_grup' ? '#eff6ff' : 'none', color: view === 'chat_grup' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>💬 Ruang Warga</button>
            {user.role === 'warga' && <button onClick={() => { setView('form'); setIsSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: '10px', border: 'none', background: view === 'form' ? '#eff6ff' : 'none', color: view === 'form' ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>✍️ Buat Aspirasi</button>}
            <button onClick={() => setUser(null)} style={{ marginTop: '20px', padding: '12px', color: '#ef4444', border: 'none', background: '#fef2f2', borderRadius: '10px', fontWeight: 'bold' }}>Keluar</button>
          </nav>
        </div>

        {/* Konten Utama */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          
          {view === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '15px' }}>Kabar Desa</h2>
              {aspirations.map(a => (
                <div key={a.id} style={{ ...styles.card, padding: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>{a.status}</div>
                  <h3 style={{ margin: '8px 0' }}>{a.judul}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>{a.deskripsi}</p>
                  <small>Oleh: {a.nama}</small>
                </div>
              ))}
            </div>
          )}

          {view === 'chat_grup' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h2>Ruang Warga (Real-time)</h2>
              <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '15px', overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalMessages.map(m => (
                  <div key={m.id} style={{ alignSelf: m.sender === user.name ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ background: m.sender === user.name ? '#2563eb' : '#f1f5f9', color: m.sender === user.name ? 'white' : '#1e293b', padding: '10px', borderRadius: '12px', fontSize: '14px' }}>
                      <small style={{display: 'block', fontWeight: 'bold', fontSize: '10px'}}>{m.sender}</small>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={kirimPesanGrup} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tulis pesan..." style={styles.input} />
                <button type="submit" style={styles.btn}>Kirim</button>
              </form>
            </div>
          )}

          {view === 'form' && (
            <div style={{maxWidth: '500px'}}>
              <h2>Kirim Aspirasi ke Server</h2>
              <form onSubmit={tambahAspirasi}>
                <input name="judul" placeholder="Judul" style={styles.input} required />
                <textarea name="deskripsi" placeholder="Deskripsi..." style={{...styles.input, height: '100px'}} required />
                <button type="submit" style={{...styles.btn, width: '100%'}}>Kirim Sekarang</button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
