import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import ErrorResponse from "../utils/ErrorResponse.js";

const protect = AsyncHandler(async (req, res, next) => {
    // Debug logging
    console.log('Session data:', req.session);
    console.log('Session ID:', req.sessionID);
    console.log('Session user:', req.session?.user);
        
    if (req.session && req.session.user && req.session.user.id) {
        try {
            // Find user in DB from the ID stored in the session
            const user = await User.findById(req.session.user.id).select("-password");
                        
            if (user) {
                console.log('User found:', user.email);
                // Attach the user object to the request
                req.user = user;
                return next();
            } else {
                console.log('User not found in database');
            }
        } catch (error) {
            console.error('Error finding user:', error);
        }
    } else {
        console.log('No session or session.user found');
    }

    // If no session, or user not found in DB, return an authorization error
    return next(new ErrorResponse("Unauthorized. Please log in.", 401));
});

const adminProtected = AsyncHandler(async (req, res, next) => {
    // Debug logging
    console.log('Admin check - Session data:', req.session);
    console.log('Admin check - Session user:', req.session?.user);
        
    if (req.session && req.session.user && req.session.user.id) {
        try {
            const user = await User.findById(req.session.user.id).select("-password");

            if (user && user.role === "admin") {
                console.log('Admin user verified:', user.email);
                req.user = user;
                return next();
            } else if (user) {
                console.log('User found but not admin:', user.role);
                return next(new ErrorResponse("Access denied. Admin privileges required.", 403));
            } else {
                console.log('User not found in database');
            }
        } catch (error) {
            console.error('Error in admin middleware:', error);
        }
    } else {
        console.log('No session data for admin check');
    }

    return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
});

export { protect, adminProtected };