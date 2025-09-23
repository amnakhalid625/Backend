import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";

const getDashboardStats = AsyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$totalPrice" },
            },
        },
    ]);

    const salesData = await Order.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                sales: { $sum: "$totalPrice" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        totalUsers,
        totalOrders,
        totalProducts,
        totalCategories,
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
        salesData,
    });
});

const getDashboardChartData = AsyncHandler(async (req, res) => {
    // Aggregate monthly new users
    const usersByMonth = await User.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalUsers: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Aggregate monthly sales (total revenue)
    const salesByMonth = await Order.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalSales: { $sum: "$totalPrice" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Aggregate monthly orders (count only)
    const ordersByMonth = await Order.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalOrders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Map results into 12 months
    const months = [
        "JAN",
        "FEB",
        "MAR",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
    ];

    const data = months.map((month, index) => {
        const userEntry = usersByMonth.find((u) => u._id === index + 1);
        const salesEntry = salesByMonth.find((s) => s._id === index + 1);
        const orderEntry = ordersByMonth.find((o) => o._id === index + 1);

        return {
            month,
            totalUsers: userEntry ? userEntry.totalUsers : 0,
            totalSales: salesEntry ? salesEntry.totalSales : 0,
            totalOrders: orderEntry ? orderEntry.totalOrders : 0,
        };
    });

    res.json(data);
});

export { getDashboardStats, getDashboardChartData };
