require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const run = async () => {
    const [email, pass] = process.argv.slice(2);
    if (!email || !pass) {
        console.log('Usage: node update-admin.js <email> <pass>');
        process.exit(0);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, password: String, role: String }));
        
        const hash = await bcrypt.hash(pass, 10);
        const res = await User.findOneAndUpdate({ role: 'ADMIN' }, { email, password: hash }, { new: true });
        
        if (res) console.log(`Updated: ${email}`);
        else console.log('Admin not found');

    } catch (err) {
        console.error(err.message);
    } finally {
        await mongoose.connection.close();
    }
};

run();
