require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
      console.log('Connected to MongoDB Atlas Successfully');
      await syncDatabaseIndexes();
      await seedAdmin();
  })
  .catch(err => {
      console.error('MongoDB Connection Failed:', err.message);
      process.exit(1);
  });

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'USER' }
});

const EmployeeSchema = new mongoose.Schema({
  employee_id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: String,
  role: String,
  status: { type: String, default: 'ACTIVE' },
  hire_date: String,
  profile_picture: String,
  mobile: { type: String },
  dob: String,
  gender: String,
  last_update: { type: Date, default: Date.now }
});

const AuditSchema = new mongoose.Schema({
  action: String,
  entity_name: String,
  entity_id: String,
  performed_by: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const AuditLog = mongoose.model('AuditLog', AuditSchema);

const syncDatabaseIndexes = async () => {
    try {
        const collection = mongoose.connection.collection('employees');
        const indexes = await collection.indexes();
        const names = indexes.map(i => i.name);
        ['email_1', 'mobile_1', 'employeeId_1'].forEach(async (target) => {
            if (names.includes(target)) await collection.dropIndex(target);
        });
    } catch (e) {}
};

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@employee.com';
        const admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({ email: adminEmail, password: hashedPassword, role: 'ADMIN' });
        }
    } catch (e) {}
};

const path = require('path');

app.use(cors());
app.use(express.json());

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
        }
    });
}

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token missing' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) { res.status(500).json({ error: 'Internal Error' }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-password');
        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/employees', authenticate, async (req, res) => {
    try {
        const { status, search, page = 0, size = 10, sortBy = 'employee_id', sortDir = 'asc' } = req.query;
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { department: new RegExp(search, 'i') }];
        }
        const count = await Employee.countDocuments(query);
        const list = await Employee.find(query).sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 }).skip(page * size).limit(parseInt(size));
        res.json({ content: list, totalElements: count, totalPages: Math.ceil(count / size) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const updated = await Employee.findOneAndUpdate(
            { employee_id: req.body.employee_id }, 
            { ...req.body, last_update: Date.now() }, 
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        const action = updated.isNew ? 'CREATE' : 'UPDATE';
        await AuditLog.create({ action, entity_name: 'Employee', entity_id: req.body.employee_id, performed_by: req.user.email });
        res.status(updated.isNew ? 201 : 200).json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const updated = await Employee.findOneAndUpdate({ employee_id: req.params.id }, req.body, { new: true });
        await AuditLog.create({ action: 'UPDATE', entity_name: 'Employee', entity_id: req.params.id, performed_by: req.user.email });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        await Employee.findOneAndDelete({ employee_id: req.params.id });
        await AuditLog.create({ action: 'DELETE', entity_name: 'Employee', entity_id: req.params.id, performed_by: req.user.email });
        res.sendStatus(204);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/files/upload', authenticate, (req, res) => {
    res.send(`avatar_${Date.now()}.png`);
});

app.get('/api/employees/audit-logs', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { page = 0, size = 20 } = req.query;
        const count = await AuditLog.countDocuments();
        const logs = await AuditLog.find().sort({ timestamp: -1 }).skip(page * size).limit(parseInt(size));
        res.json({ content: logs, totalElements: count, totalPages: Math.ceil(count / size) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
