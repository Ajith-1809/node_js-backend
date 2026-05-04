require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const run = async () => {
    const [email, pass, role = 'USER'] = process.argv.slice(2);
    if (!email || !pass) {
        console.log('Usage: node create-user.js <email> <pass> <role>');
        process.exit(0);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, password: String, role: String }));
        
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('User already exists');
            process.exit(1);
        }

        const hash = await bcrypt.hash(pass, 10);
        await User.create({ email, password: hash, role: role.toUpperCase() });
        console.log(`Created: ${email} (${role})`);

    } catch (err) {
        console.error(err.message);
    } finally {
        await mongoose.connection.close();
    }
};

run();
