import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, History, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Determine API Base URL based on environment
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : `http://${window.location.hostname}:3000`;

interface SummaryData {
  totalPackages: number | string;
  totalSalary: number | string;
  recordCount: number;
  period: string;
}

interface Record {
  id: number;
  date: string;
  packageCount: number;
  ratePerPackage: number;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function App() {
  // --- State Setup ---
  const [summary, setSummary] = useState<SummaryData>({ 
    totalPackages: 0, totalSalary: 0, recordCount: 0, period: '' 
  });
  const [records, setRecords] = useState<Record[]>([]);
  const [newCount, setNewCount] = useState('');
  const [loading, setLoading] = useState(true);
  
  const now = new Date();
  const [viewingMonth, setViewingMonth] = useState(now.getMonth() + 1);
  const [viewingYear] = useState(now.getFullYear());
  const [submitDate, setSubmitDate] = useState(now.toISOString().split('T')[0]);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [showAll, setShowAll] = useState(false);

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const params = { month: viewingMonth, year: viewingYear };
      const [summaryRes, recordsRes] = await Promise.all([
        axios.get(`${API_BASE}/summary`, { params }),
        axios.get(`${API_BASE}/records`, { params })
      ]);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-adjust submit date when user switches months
    const currentDate = new Date();
    if (viewingMonth === currentDate.getMonth() + 1 && viewingYear === currentDate.getFullYear()) {
      setSubmitDate(currentDate.toISOString().split('T')[0]);
    } else {
      setSubmitDate(`${viewingYear}-${String(viewingMonth).padStart(2, '0')}-01`);
    }
  }, [viewingMonth, viewingYear]);

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCount || !submitDate) return;

    try {
      // Evaluate simple addition like "10+5+2"
      const totalCount = newCount.split('+').reduce((acc, current) => {
        const val = parseInt(current.trim());
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      if (totalCount <= 0) {
        alert('Jumlah paket harus lebih dari 0');
        return;
      }

      await axios.post(`${API_BASE}/records`, {
        date: submitDate,
        packageCount: totalCount
      });
      
      setNewCount('');
      fetchData();
      alert(`Berhasil menambah ${totalCount} paket!`);
    } catch (error: any) {
      console.error('Error adding record:', error);
      alert('Gagal menambah data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      await axios.put(`${API_BASE}/records/${editingRecord.id}`, {
        packageCount: editingRecord.packageCount,
        date: editingRecord.date
      });
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await axios.delete(`${API_BASE}/records/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="app-container">
      {/* Month Selector Pills */}
      <div className="month-selector">
        {MONTHS.map((name, i) => (
          <div 
            key={name}
            className={`month-pill ${viewingMonth === i + 1 ? 'active' : ''}`}
            onClick={() => setViewingMonth(i + 1)}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Main Stats Card */}
      <motion.div 
        key={`summary-${viewingMonth}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card dashboard-card"
      >
        <div className="summary-label">Gajian {MONTHS[viewingMonth - 1]}</div>
        <div className="summary-value">{formatCurrency(summary.totalSalary)}</div>
        <div style={{ display: 'flex', gap: '30px', marginTop: '15px' }}>
          <div>
            <div className="summary-label" style={{ fontSize: '0.75rem' }}>Total Paket</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{summary.totalPackages} Pkgs</div>
          </div>
          <div>
            <div className="summary-label" style={{ fontSize: '0.75rem' }}>Total Hari</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{summary.recordCount} Days</div>
          </div>
        </div>
      </motion.div>

      {/* Submission Form */}
      <motion.div className="glass-card">
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="var(--accent-color)" /> Log Baru
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label className="summary-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '6px' }}>Tanggal</label>
              <input 
                type="date" 
                className="input-field" 
                value={submitDate}
                onChange={(e) => setSubmitDate(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label className="summary-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '6px' }}>Jml Paket</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Misal: 10+5"
                value={newCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCount(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Submit Ke Riwayat
          </button>
        </form>
      </motion.div>

      {/* History Record List */}
      <motion.div className="glass-card">
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--accent-color)" /> Riwayat {MONTHS[viewingMonth - 1]}
        </h3>
        <div className="history-list">
          <AnimatePresence mode="popLayout">
            {records.slice()
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, showAll ? undefined : 3)
              .map((rec) => (
                <motion.div 
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="history-item"
                >
                  <div>
                    <div className="date-label">
                      {new Date(rec.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{rec.packageCount} Pkgs</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn" onClick={() => setEditingRecord(rec)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn" onClick={() => handleDelete(rec.id)}>
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </motion.div>
            ))}
          </AnimatePresence>
          
          {records.length > 3 && (
            <button 
              className="action-btn" 
              style={{ width: '100%', marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Sembunyikan' : `Lihat ${records.length - 3} paket lainnya...`}
            </button>
          )}

          {records.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
              Belum ada data di bulan ini
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal Overlay */}
      <AnimatePresence>
        {editingRecord && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card modal-content"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ margin: 0 }}>Ubah Data</h3>
                <button className="action-btn" onClick={() => setEditingRecord(null)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate}>
                <label className="summary-label" style={{ display: 'block', marginBottom: '8px' }}>Tanggal</label>
                <input 
                  type="date" 
                  className="input-field"
                  value={editingRecord.date ? (editingRecord.date as string).split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRecord({...editingRecord, date: e.target.value})}
                />
                <label className="summary-label" style={{ display: 'block', marginBottom: '8px' }}>Jumlah Paket</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={editingRecord.packageCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRecord({...editingRecord, packageCount: parseInt(e.target.value)})}
                />
                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                  Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
