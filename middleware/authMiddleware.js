import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import ErrorResponse from "../utils/ErrorResponse.js";

const protect = AsyncHandler(async (req, res, next) => {
    console.log('\n=== PROTECT MIDDLEWARE ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session?.user);
    
    // Check if session exists and has user data
    if (req.session && req.session.user && req.session.user.id) {
        try {
            // Find user in DB from the ID stored in the session
            const user = await User.findById(req.session.user.id).select("-password");
                                     
            if (user) {
                console.log('✅ User authenticated:', user.email);
                req.user = user;
                return next();
            } else {
                console.log('❌ User not found in database');
            }
        } catch (error) {
            console.error('Error finding user:', error);
        }
    } else {
        console.log('❌ No session or session.user found');
        console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    }

    return next(new ErrorResponse("Unauthorized. Please log in.", 401));
});

const adminProtected = AsyncHandler(async (req, res, next) => {
    console.log('\n=== ADMIN MIDDLEWARE ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session?.user);
    console.log('All session keys:', req.session ? Object.keys(req.session) : 'No session');
    
    // Enhanced session checking with more detailed logging
    if (!req.session) {
        console.log('❌ No session object');
        return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
    }

    if (!req.session.user) {
        console.log('❌ No user in session');
        console.log('Session contents:', JSON.stringify(req.session, null, 2));
        return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
    }

    if (!req.session.user.id) {
        console.log('❌ No user ID in session');
        console.log('User object:', req.session.user);
        return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
    }

    try {
        const user = await User.findById(req.session.user.id).select("-password");

        if (!user) {
            console.log('❌ User not found in database for ID:', req.session.user.id);
            return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
        }

        if (user.role !== "admin") {
            console.log('❌ User found but not admin. Role:', user.role);
            return next(new ErrorResponse("Access denied. Admin privileges required.", 403));
        }

        console.log('✅ Admin user verified:', user.email);
        req.user = user;
        return next();

    } catch (error) {
        console.error('❌ Error in admin middleware:', error);
        return next(new ErrorResponse("Internal server error", 500));
    }
});

// Add a session debugging middleware (use only in development)
const debugSession = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('\n=== SESSION DEBUG ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session cookie:', req.headers.cookie);
        console.log('Session data:', JSON.stringify(req.session, null, 2));
    }
    next();
};

export { protect, adminProtected, debugSession };