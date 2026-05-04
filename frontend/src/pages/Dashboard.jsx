import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, deleteEmployee, createEmployee, updateEmployee, getMe, uploadFile, getAuditLogs } from '../api';
import { Users, UserPlus, UserCheck, UserMinus, LogOut, Edit2, Trash2, ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, UploadCloud, Activity, X, Hash, BadgeInfo, Filter, AlertTriangle, LogOut as LogOutIcon, Calendar, Phone, User as UserIcon, Cake } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('employeeId');
  const [sortDir, setSortDir] = useState('asc');

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); 
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  
  const [formData, setFormData] = useState({ 
    employeeId: '', name: '', email: '', department: '', role: '', 
    status: 'ACTIVE', hireDate: '', profilePicture: '', 
    mobile: '', dob: '', gender: 'Male' 
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (showAuditLogs) {
        fetchAuditLogs();
      } else {
        fetchData();
      }
    }
  }, [filter, search, deptFilter, page, size, sortBy, sortDir, user, showAuditLogs]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  const fetchUser = async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch (err) {
      navigate('/login');
    }
  };

  const fetchData = async () => {
    try {
      const data = await getEmployees({ status: filter, search, page, size, sortBy, sortDir });
      if (data && data.content !== undefined) {
        let list = data.content || [];
        if (deptFilter) list = list.filter(e => e.department === deptFilter);
        setEmployees(list);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        let list = data;
        if (deptFilter) list = list.filter(e => e.department === deptFilter);
        setEmployees(list);
        setTotalPages(1);
        setTotalElements(list.length);
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await getAuditLogs(page, size);
      if (data && data.content !== undefined) {
        setAuditLogs(data.content);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      showToast('Audit log error', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
        showToast('Invalid email format', 'error');
        return false;
    }

    const mobileRegex = /^\+?[0-9]{10,15}$/;
    if (!mobileRegex.test(formData.mobile)) {
        showToast('Invalid mobile number', 'error');
        return false;
    }

    const now = new Date();
    const dob = new Date(formData.dob);
    const hire = new Date(formData.hireDate);

    if (dob > now) {
        showToast('DOB cannot be in the future', 'error');
        return false;
    }
    if (hire > now) {
        showToast('Hire Date cannot be in the future', 'error');
        return false;
    }

    const age = calculateAge(formData.dob);
    if (age < 18) {
        showToast(`Age is ${age}. Min 18 required.`, 'error');
        return false;
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (user.role !== 'ADMIN') {
        showToast('Access denied', 'error');
        return;
    }

    if (!validateForm()) return;

    try {
      let finalData = { ...formData };
      finalData.employee_id = parseInt(formData.employeeId);
      finalData.profile_picture = formData.profilePicture;
      finalData.hire_date = formData.hireDate;
      finalData.dob = formData.dob;
      finalData.gender = formData.gender;

      if (selectedFile) {
        const fileName = await uploadFile(selectedFile);
        finalData.profile_picture = fileName;
      }

      if (editingEmp) {
        await updateEmployee(editingEmp.employee_id, finalData);
        showToast('Employee updated');
      } else {
        await createEmployee(finalData);
        showToast('Employee created');
      }
      setShowModal(false);
      setSelectedFile(null);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Error processing request', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteEmployee(showDeleteModal.employee_id);
      showToast('Employee deleted');
      setShowDeleteModal(null);
      fetchData();
    } catch(err) {
      showToast('Error deleting employee', 'error');
      setShowDeleteModal(null);
    }
  };

  const openModal = (emp = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({ 
        ...emp, 
        employeeId: emp.employee_id || '', 
        hireDate: emp.hire_date || '', 
        profilePicture: emp.profile_picture || '',
        mobile: emp.mobile || '',
        dob: emp.dob || '',
        gender: emp.gender || 'Male'
      });
    } else {
      setEditingEmp(null);
      setFormData({ 
        employeeId: '', name: '', email: '', department: '', role: '', 
        status: 'ACTIVE', hireDate: new Date().toISOString().split('T')[0], 
        profilePicture: '', mobile: '', dob: '', gender: 'Male'
      });
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  if (!user) return <div style={{color:'white', padding:'2rem', textAlign:'center'}}>Loading...</div>;

  const isAdmin = user.role === 'ADMIN';
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveCount = employees.length - activeCount;
  
  const statusData = [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Inactive', value: inactiveCount, color: '#ef4444' }
  ];

  const deptCount = {};
  employees.forEach(e => { if(e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });
  const deptData = Object.keys(deptCount).map(k => ({ name: k, value: deptCount[k] }));

  const genderCount = { 'Male': 0, 'Female': 0, 'Other': 0 };
  employees.forEach(e => { 
    if (e.gender === 'Male' || e.gender === 'Female' || e.gender === 'Other') {
        genderCount[e.gender]++;
    }
  });
  const genderData = Object.keys(genderCount).map(k => ({ name: k, value: genderCount[k] }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const currentAge = calculateAge(formData.dob);

  return (
    <div className="container page-animate">
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: notification.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
          color: 'white', padding: '1rem', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'modalIn 0.3s ease', borderLeft: '4px solid rgba(0,0,0,0.2)'
        }}>
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <UserCheck size={20} />}
          <div style={{fontWeight:500}}>{notification.message}</div>
          <X size={16} style={{cursor:'pointer', marginLeft:'1rem', opacity:0.7}} onClick={() => setNotification(null)} />
        </div>
      )}

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="glass-panel modal-content modal-animate" style={{maxWidth:'400px', textAlign:'center'}} onClick={e => e.stopPropagation()}>
            <div style={{color:'var(--primary-color)', marginBottom:'1rem'}}><LogOutIcon size={48} /></div>
            <h2>Confirm Logout</h2>
            <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>Are you sure you want to sign out?</p>
            <div className="flex-between">
                <button className="btn" onClick={() => setShowLogoutModal(false)} style={{background:'transparent', border:'1px solid var(--border-color)', color:'white'}}>Stay</button>
                <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar glass-panel">
        <div className="navbar-brand">
            HR Analytics 
            <span style={{fontSize: '0.85rem', color:'var(--primary-color)', marginLeft:'1rem', padding:'0.2rem 0.6rem', background:'rgba(59,130,246,0.1)', borderRadius:'12px', fontWeight:'normal'}}>
                {user.email}
            </span>
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          {isAdmin && (
            <button onClick={() => {setShowAuditLogs(!showAuditLogs); setPage(0); fetchData();}} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
              <Activity size={18} /> {showAuditLogs ? 'Employees' : 'Audit Logs'}
            </button>
          )}
          <button onClick={() => setShowLogoutModal(true)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {!showAuditLogs ? (
        <>
          <div className="dashboard-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'}}>
            <div className="glass-panel" style={{padding:'1.5rem', height:'300px'}}>
               <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>Status Ratio</h3>
               <ResponsiveContainer width="100%" height="90%">
                 <PieChart>
                    <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                 </PieChart>
               </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{padding:'1.5rem', height:'300px'}}>
               <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>Department Distribution</h3>
               <ResponsiveContainer width="100%" height="90%">
                 <BarChart data={deptData}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} />
                    <Tooltip contentStyle={{background:'var(--bg-color)', border:'none', borderRadius:'8px'}} />
                    <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{padding:'1.5rem', height:'300px'}}>
               <h3 style={{fontSize:'1rem', marginBottom:'1rem'}}>Gender Diversity</h3>
               <ResponsiveContainer width="100%" height="90%">
                 <PieChart>
                    <Pie data={genderData} outerRadius={80} dataKey="value" label>
                        {genderData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                 </PieChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginTop:'2rem' }}>
            <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>Employee Directory</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} style={{ paddingLeft: '2.5rem', width: '220px' }} />
                  <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.85rem', color: 'var(--text-secondary)' }} />
                </div>
                <select className="form-control" style={{width:'auto'}} value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => openModal()}>
                    <UserPlus size={18} /> Add
                  </button>
                )}
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Mobile</th>
                    <th>DOB</th>
                    <th>Hire Date</th>
                    <th>Dept & Role</th>
                    <th>Status</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.employee_id}>
                      <td style={{fontWeight: 600, color: 'var(--primary-color)'}}>{emp.employee_id}</td>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                            {emp.profile_picture ? (
                                <img src={`https://vyosnsawfeenznrdhnkv.supabase.co/storage/v1/object/public/avatars/${emp.profile_picture}`} style={{width:'32px', height:'32px', borderRadius:'8px'}} />
                            ) : (
                                <div style={{width:'32px', height:'32px', borderRadius:'8px', background:'var(--primary-color)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'0.75rem'}}>{emp.name?.charAt(0)}</div>
                            )}
                            <div>
                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                            </div>
                        </div>
                      </td>
                      <td><span style={{fontSize:'0.85rem'}}>{emp.gender}</span></td>
                      <td style={{fontSize:'0.85rem'}}>{emp.mobile}</td>
                      <td style={{fontSize:'0.85rem'}}>{emp.dob}</td>
                      <td style={{fontSize:'0.85rem'}}>{emp.hire_date}</td>
                      <td>
                          <div style={{fontSize:'0.85rem'}}>{emp.department}</div>
                          <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>{emp.role}</div>
                      </td>
                      <td><span className={`badge badge-${emp.status?.toLowerCase()}`}>{emp.status}</span></td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn" style={{ padding: '0.3rem', background: '#3b82f6', color: 'white' }} onClick={() => openModal(emp)}><Edit2 size={12} /></button>
                            <button className="btn" style={{ padding: '0.3rem', background: '#ef4444', color: 'white' }} onClick={() => setShowDeleteModal(emp)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <div style={{fontSize:'0.85rem', opacity:0.6}}>Showing {employees.length} of {totalElements} results</div>
                <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                  <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
                  <span style={{fontSize:'0.85rem', fontWeight:'600'}}>Page {page + 1} of {totalPages}</span>
                  <button className="btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass-panel page-animate" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{marginBottom:'2rem'}}>
            <h2>Project Activity Logs</h2>
            <button className="btn" onClick={() => setShowAuditLogs(false)}>Back</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Timestamp</th><th>Action</th><th>Target</th><th>Performed By</th></tr></thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                        <span className="badge" style={{
                            background: log.action === 'DELETE' ? 'rgba(239,68,68,0.2)' : log.action === 'UPDATE' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                            color: log.action === 'DELETE' ? '#f87171' : log.action === 'UPDATE' ? '#60a5fa' : '#34d399'
                        }}>{log.action}</span>
                    </td>
                    <td>{log.entity_name} #{log.entity_id}</td>
                    <td>{log.performed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content modal-animate" style={{maxWidth:'650px'}} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{marginBottom:'1.5rem'}}>
                <h2 style={{ margin: 0 }}>{editingEmp ? 'Edit' : 'Add'} Employee</h2>
                <button className="btn" onClick={() => setShowModal(false)} style={{padding:'0.5rem'}}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem'}}>
                  <div style={{flex:1}}>
                    <div className="flex-between" style={{alignItems:'center'}}>
                        <label className="form-label">Date of Birth</label>
                        {currentAge !== null && (
                            <span style={{
                                fontSize:'0.7rem', 
                                fontWeight:'600', 
                                padding:'0.1rem 0.4rem', 
                                borderRadius:'6px',
                                background: currentAge < 18 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: currentAge < 18 ? 'var(--danger-color)' : 'var(--success-color)',
                                display:'flex', alignItems:'center', gap:'0.2rem'
                            }}>
                                <Cake size={10} /> {currentAge} yrs
                            </span>
                        )}
                    </div>
                    <input required type="date" className="form-control" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label className="form-label">Mobile Number</label>
                    <input required type="tel" className="form-control" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="+91..." />
                  </div>
                  <div style={{flex:1}}>
                    <label className="form-label">Gender</label>
                    <select className="form-control" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                  </div>
              </div>

              <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Emp ID (Numeric)</label>
                    <input required type="number" className="form-control" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Email</label>
                    <input required type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Department</label>
                  <input required type="text" className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Role</label>
                  <input required type="text" className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Hire Date</label>
                  <input required type="date" className="form-control" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={currentAge !== null && currentAge < 18}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="glass-panel modal-content modal-animate" style={{maxWidth:'400px', textAlign:'center'}} onClick={e => e.stopPropagation()}>
            <div style={{color:'var(--danger-color)', marginBottom:'1rem'}}><AlertTriangle size={48} /></div>
            <h2>Confirm Delete</h2>
            <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>Delete <strong>{showDeleteModal.name}</strong>?</p>
            <div className="flex-between">
                <button className="btn" onClick={() => setShowDeleteModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
