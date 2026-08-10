import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, LogOut, 
  Search, Shield, Smartphone, Key, Copy, X, ChevronRight, CheckCircle2, Film
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import './index.css';

const API_BASE_URL = 'https://aura-auth-api-theta.vercel.app/api';

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard!');
};

// --- Trial Progress Bar ---
const TrialBar = ({ renderCount = 0, trialRenderLimit = 0 }) => {
  const pct = trialRenderLimit > 0 ? Math.min((renderCount / trialRenderLimit) * 100, 100) : 0;
  const remaining = Math.max(trialRenderLimit - renderCount, 0);
  const color = pct >= 100 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span className="text-muted">Rendered: <strong style={{ color }}>{renderCount} / {trialRenderLimit}</strong></span>
        <span className="text-muted">Remaining: <strong style={{ color }}>{remaining}</strong></span>
      </div>
      <div style={{ height: '8px', background: 'var(--bg-dark)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

const Badge = ({ status, isTrial }) => {
  if (isTrial && status === 'active') return <span className="badge badge-trial">Trial</span>;
  const classes = { active: 'badge-active', inactive: 'badge-inactive', trial: 'badge-trial', expired: 'badge-expired' };
  return <span className={`badge ${classes[status] || 'badge-inactive'}`}>{status}</span>;
};

const AdminLayout = ({ children, onLogout }) => (
  <div className="app-layout">
    <aside className="sidebar">
      <div className="sidebar-brand"><Shield size={24} /><span>Aura License</span></div>
      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={20} /> Dashboard</NavLink>
        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Users size={20} /> User Management</NavLink>
        <NavLink to="/create-user" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><UserPlus size={20} /> Create User</NavLink>
      </nav>
      <button onClick={onLogout} className="nav-link text-danger" style={{ marginTop: 'auto' }}><LogOut size={20} /> Logout</button>
    </aside>
    <main className="main-content">{children}</main>
  </div>
);

const Login = ({ setAuthToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, machineId: 'admin', deviceId: 'admin', deviceName: 'Admin', platform: 'web', osVersion: '1', machineName: 'Admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.user.isAdmin) throw new Error('Access denied: Not an admin account');
      setAuthToken(data.token);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="login-container">
      <div className="card login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Shield size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h2>Admin Login</h2>
          <p className="text-muted">Sign in to manage licenses</p>
        </div>
        <form onSubmit={handleLogin}>
          {error && <div className="card text-danger" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</div>}
          <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? <div className="spinner"></div> : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(console.error);
  }, [token]);
  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, cls: '' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, cls: 'text-success' },
    { label: 'Trial Users', value: stats.totalTrialUsers, cls: 'text-warning' },
    { label: 'Expired Trials', value: stats.expiredTrials, cls: 'text-danger' },
    { label: 'Inactive Users', value: stats.inactiveSubscriptions, cls: 'text-muted' },
    { label: 'Expired Subscriptions', value: stats.expiredUsers, cls: 'text-danger' },
    { label: 'Expiring Soon (7 Days)', value: stats.expiringSoon, cls: '' },
  ] : [];
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Dashboard Overview</h1></div>
      {stats ? (
        <div className="stats-grid">
          {cards.map(c => (
            <div className="card stat-card" key={c.label}>
              <span className={`stat-title ${c.cls}`}>{c.label}</span>
              <span className={`stat-value ${c.cls}`}>{c.value}</span>
            </div>
          ))}
        </div>
      ) : <div className="spinner"></div>}
    </div>
  );
};

const UsersList = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/users?search=${search}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); setUsers(data); setLoading(false); });
  };
  useEffect(() => { const t = setTimeout(fetchUsers, 300); return () => clearTimeout(t); }, [search, token]);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search name, email, license..." style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card table-container">
        {loading ? <div className="spinner" style={{ margin: '2rem auto' }}></div> : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Status</th><th>Trial Usage</th><th>Expires</th><th>Devices</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                let status = u.subscriptionStatus;
                if (!u.isTrial && u.expiresAt && isPast(new Date(u.expiresAt))) status = 'expired';
                const trialExhausted = u.isTrial && u.renderCount >= u.trialRenderLimit;
                return (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <Badge status={trialExhausted ? 'expired' : status} isTrial={u.isTrial} />
                    </td>
                    <td>
                      {u.isTrial ? (
                        <div style={{ minWidth: '140px' }}>
                          <TrialBar renderCount={u.renderCount} trialRenderLimit={u.trialRenderLimit} />
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">{u.expiresAt ? format(new Date(u.expiresAt), 'MMM dd, yyyy') : '—'}</td>
                    <td>{u.devices?.length || 0} / {u.maxDevices}</td>
                    <td className="text-muted">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/user/${u._id}`)}>Manage <ChevronRight size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const CreateUser = ({ token }) => {
  const [formData, setFormData] = useState({ name: '', email: '', maxDevices: 2, singleActiveSession: false, isTrial: false, trialRenderLimit: 5 });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setCreated(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/create-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreated(data.user);
      setFormData({ name: '', email: '', maxDevices: 2, singleActiveSession: false, isTrial: false, trialRenderLimit: 5 });
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Create New License</h1></div>
      <div className="card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Customer Name</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Customer Email</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Max Devices</label><input type="number" min="1" className="form-control" value={formData.maxDevices} onChange={e => setFormData({ ...formData, maxDevices: Number(e.target.value) })} required /></div>
          <div className="checkbox-group mt-4">
            <input type="checkbox" id="singleSession" checked={formData.singleActiveSession} onChange={e => setFormData({ ...formData, singleActiveSession: e.target.checked })} />
            <label htmlFor="singleSession" className="form-label" style={{ marginBottom: 0 }}>Enforce Single Active Session</label>
          </div>
          <div className="checkbox-group mb-4">
            <input type="checkbox" id="trial" checked={formData.isTrial} onChange={e => setFormData({ ...formData, isTrial: e.target.checked })} />
            <label htmlFor="trial" className="form-label" style={{ marginBottom: 0 }}>Give Free Trial (Usage-Based)</label>
          </div>
          {formData.isTrial && (
            <div className="form-group" style={{ background: 'rgba(99,102,241,0.08)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Film size={16} /> Free Render Limit</label>
              <input type="number" min="1" max="100" className="form-control" value={formData.trialRenderLimit} onChange={e => setFormData({ ...formData, trialRenderLimit: Number(e.target.value) })} />
              <small className="text-muted" style={{ marginTop: '0.4rem', display: 'block' }}>User can render up to {formData.trialRenderLimit} video(s) for free.</small>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? <div className="spinner"></div> : <><UserPlus size={18} /> Generate User & License</>}
          </button>
        </form>
      </div>
      {created && (
        <div className="card" style={{ maxWidth: '600px', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><CheckCircle2 className="text-success" /> User Created Successfully</h3>
          {created.isTrial && (
            <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--warning)', fontSize: '0.9rem' }}>
              🎁 Trial account — <strong>{created.trialRenderLimit} free renders</strong> granted.
            </div>
          )}
          {[['Email', created.email], ['Password', created.password], ['License Key', created.licenseKey]].map(([label, val]) => (
            <div key={label} className="flex-between" style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <div><div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div><div style={{ fontWeight: 600, color: label === 'License Key' ? 'var(--primary)' : undefined }}>{val}</div></div>
              <button className="btn btn-sm btn-secondary" onClick={() => copyToClipboard(val)}><Copy size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserDetails = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subModal, setSubModal] = useState(false);
  const [limitModal, setLimitModal] = useState(false);

  const fetchUser = () => {
    fetch(`${API_BASE_URL}/admin/user/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(u => { setUser(u); setLoading(false); });
  };

  useEffect(() => { if (id) fetchUser(); }, [id, token]);

  const apiCall = async (endpoint, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: id, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message); fetchUser(); return true;
    } catch (err) { alert(err.message); return false; }
  };

  const deleteUserCall = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`${API_BASE_URL}/admin/delete-user`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: id })
    });
    if (!res.ok) { alert('Failed to delete'); return; }
    navigate('/users');
  };

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }}></div>;
  if (!user) return <div>User not found</div>;

  let displayStatus = user.subscriptionStatus;
  if (!user.isTrial && user.expiresAt && isPast(new Date(user.expiresAt))) displayStatus = 'expired';
  const trialExhausted = user.isTrial && user.renderCount >= user.trialRenderLimit;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-sm btn-secondary mb-4" onClick={() => navigate('/users')}>&larr; Back to Users</button>
          <h1 className="page-title">{user.name}</h1>
          <p className="text-muted">{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => apiCall('reset-password', {})}>Reset Password</button>
          <button className="btn btn-danger" onClick={deleteUserCall}>Delete User</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* License Info */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={20} /> License Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between"><span className="text-muted">License Key</span><code style={{ color: 'var(--primary)' }}>{user.licenseKey}</code></div>
            <div className="flex-between">
              <span className="text-muted">Status</span>
              <Badge status={trialExhausted ? 'expired' : displayStatus} isTrial={user.isTrial && !trialExhausted} />
            </div>
            <div className="flex-between"><span className="text-muted">Expires At</span><span>{user.expiresAt ? format(new Date(user.expiresAt), 'PPP') : 'Never'}</span></div>
            <div className="flex-between mt-4">
              <button className="btn btn-sm btn-primary" onClick={() => setSubModal(true)}>Update Subscription</button>
              {user.subscriptionStatus === 'active' && (
                <button className="btn btn-sm btn-danger" onClick={() => apiCall('deactivate-subscription', {})}>Deactivate</button>
              )}
            </div>
          </div>
        </div>

        {/* Trial Info or Device Info */}
        {user.isTrial ? (
          <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Film size={20} /> Trial Usage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <TrialBar renderCount={user.renderCount} trialRenderLimit={user.trialRenderLimit} />
              <div className="flex-between"><span className="text-muted">Renders Used</span><strong>{user.renderCount}</strong></div>
              <div className="flex-between"><span className="text-muted">Total Limit</span><strong>{user.trialRenderLimit}</strong></div>
              <div className="flex-between"><span className="text-muted">Remaining</span>
                <strong style={{ color: trialExhausted ? 'var(--danger)' : 'var(--success)' }}>
                  {trialExhausted ? '0 — Exhausted' : Math.max(user.trialRenderLimit - user.renderCount, 0)}
                </strong>
              </div>
              {trialExhausted && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.85rem' }}>⚠ Trial exhausted. Activate a plan to restore access.</div>}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={20} /> Device Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex-between">
                <span className="text-muted">Device Limit</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{user.maxDevices}</span>
                  <button className="btn btn-sm btn-secondary" onClick={() => setLimitModal(true)}>Change</button>
                </div>
              </div>
              <div className="flex-between"><span className="text-muted">Registered Devices</span><span>{user.devices?.length || 0}</span></div>
              <div className="flex-between mt-4">
                <button className="btn btn-sm btn-warning" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }} onClick={() => { if (window.confirm('Reset all devices?')) apiCall('reset-devices', {}); }}>Reset All Devices</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Device list (always shown) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={20} /> Registered Devices
          <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setLimitModal(true)}>Change Limit ({user.maxDevices})</button>
          <button className="btn btn-sm btn-warning" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)', marginLeft: '0.5rem' }} onClick={() => { if (window.confirm('Reset all devices?')) apiCall('reset-devices', {}); }}>Reset All</button>
        </h3>
        {user.devices && user.devices.length > 0 ? (
          <table style={{ width: '100%' }}>
            <thead><tr><th>Device Name</th><th>Platform</th><th>Registered At</th><th>Action</th></tr></thead>
            <tbody>
              {user.devices.map(d => (
                <tr key={d.deviceId}>
                  <td>{d.deviceName || d.machineName}<br /><small className="text-muted">{d.deviceId}</small></td>
                  <td>{d.platform} {d.osVersion}</td>
                  <td>{format(new Date(d.registeredAt), 'MMM dd, yyyy')}</td>
                  <td><button className="btn btn-sm btn-danger" onClick={() => apiCall('delete-device', { deviceId: d.deviceId })}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-muted">No devices registered.</p>}
      </div>

      {/* Subscription Modal */}
      {subModal && (
        <div className="modal-overlay" onClick={() => setSubModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Activate / Update Subscription</h3>
              <button className="close-btn" onClick={() => setSubModal(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[['1-month', '1 Month'], ['3-months', '3 Months'], ['6-months', '6 Months'], ['1-year', '1 Year'], ['lifetime', 'Lifetime ♾']].map(([plan, label]) => (
                <button key={plan} className={`btn ${plan === 'lifetime' ? 'btn-primary' : 'btn-secondary'}`} onClick={async () => { await apiCall('activate-subscription', { plan }); setSubModal(false); }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Device Limit Modal */}
      {limitModal && (
        <div className="modal-overlay" onClick={() => setLimitModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Device Limit</h3>
              <button className="close-btn" onClick={() => setLimitModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); apiCall('change-device-limit', { limit: Number(e.target.limit.value) }).then(ok => ok && setLimitModal(false)); }}>
              <div className="form-group"><label className="form-label">New Limit</label><input type="number" name="limit" defaultValue={user.maxDevices} min="1" className="form-control" required /></div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Limit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const handleLogout = () => { setToken(null); localStorage.removeItem('adminToken'); };
  const handleSetToken = (t) => { setToken(t); localStorage.setItem('adminToken', t); };
  if (!token) return <Login setAuthToken={handleSetToken} />;
  return (
    <Router>
      <AdminLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard token={token} />} />
          <Route path="/users" element={<UsersList token={token} />} />
          <Route path="/create-user" element={<CreateUser token={token} />} />
          <Route path="/user/:id" element={<UserDetails token={token} />} />
        </Routes>
      </AdminLayout>
    </Router>
  );
};

export default App;
