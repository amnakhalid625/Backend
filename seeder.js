import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();

// Connect to database
await connectDB();

const createAdminUser = async () => {
    try {
        console.log('🔍 Checking for existing admin users...'.blue);
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists:'.green);
            console.log(`   Name: ${existingAdmin.name}`.yellow);
            console.log(`   Email: ${existingAdmin.email}`.yellow);
            console.log(`   Role: ${existingAdmin.role}`.yellow);
            
            // Test password comparison
            const isPasswordValid = await existingAdmin.comparePassword('password123');
            console.log(`   Password 'password123' works: ${isPasswordValid ? 'Yes' : 'No'}`.yellow);
            
            process.exit(0);
        }

        console.log('🔧 Creating new admin user...'.blue);

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123', // Will be hashed by pre-save hook
            role: 'admin',
        });

        console.log('✅ Admin user created successfully!'.green.inverse);
        console.log('');
        console.log('📧 Login Credentials:'.cyan.bold);
        console.log(`   Email: ${adminUser.email}`.yellow);
        console.log(`   Password: password123`.yellow);
        console.log(`   Role: ${adminUser.role}`.yellow);
        console.log('');
        console.log('🚀 You can now login to your admin dashboard!'.green);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:'.red, error.message);
        process.exit(1);
    }
};

const resetData = async () => {
    try {
        console.log('🗑️  Resetting all data...'.red);
        
        await User.deleteMany({});
        
        console.log('✅ All data cleared!'.green);
        
        // Create fresh admin user
        await createAdminUser();
        
    } catch (error) {
        console.error('❌ Error resetting data:'.red, error.message);
        process.exit(1);
    }
};

const listUsers = async () => {
    try {
        console.log('👥 Current users in database:'.blue);
        
        const users = await User.find({}).select('-password');
        
        if (users.length === 0) {
            console.log('   No users found.'.yellow);
        } else {
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`.green);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:'.red, error.message);
        process.exit(1);
    }
};

// Check command line arguments
const command = process.argv[2];

switch (command) {
    case '--reset':
    case '-r':
        resetData();
        break;
    case '--list':
    case '-l':
        listUsers();
        break;
    case '--help':
    case '-h':
        console.log('📖 Available commands:'.blue);
        console.log('   node seeder.js          - Create admin user (default)');
        console.log('   node seeder.js --reset  - Reset all data and create admin user');
        console.log('   node seeder.js --list   - List all users');
        console.log('   node seeder.js --help   - Show this help');
        process.exit(0);
        break;
    default:
        createAdminUser();
        break;
}