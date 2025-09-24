import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import connectDB from './config/db.js';

// Adjust the path if your folder structure is different.
import { productsData } from '../frontend/src/constants/productsData.js';

dotenv.config();

await connectDB();

const importData = async () => {
    try {
        // Clear existing data
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        // Create a default admin user
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123', // The password will be hashed by the model pre-save hook
            role: 'admin',
        });

        console.log('Admin user created!'.cyan.inverse);
        console.log('Email: admin@example.com'.yellow);
        console.log('Password: password123'.yellow);

        // Insert products from your static data file
        await Product.insertMany(productsData);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}