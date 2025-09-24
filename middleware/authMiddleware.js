import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import ErrorResponse from "../utils/ErrorResponse.js";

const protect = AsyncHandler(async (req, res, next) => {
    console.log('Session data:', req.session);
    console.log('Session ID:', req.sessionID);
    console.log('Session user:', req.session?.user);
    
    if (req.session && req.session.user && req.session.user.id) {
        try {
            const user = await User.findById(req.session.user.id).select("-password");
            
            if (user) {
                console.log('User found:', user.email, 'Role:', user.role);
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

    return next(new ErrorResponse("Unauthorized. Please log in.", 401));
});

// Simplified admin middleware - allows any logged-in user for development
const adminProtected = AsyncHandler(async (req, res, next) => {
    console.log('Admin check - Session data:', req.session);
    
    if (req.session && req.session.user && req.session.user.id) {
        try {
            const user = await User.findById(req.session.user.id).select("-password");
            
            if (user) {
                console.log('User verified:', user.email, 'Role:', user.role);
                req.user = user;
                
                // FOR DEVELOPMENT: Allow any logged-in user
                // FOR PRODUCTION: Uncomment the line below to restrict to admin only
                // if (user.role !== "admin") {
                //     return next(new ErrorResponse("Access denied. Admin privileges required.", 403));
                // }
                
                return next();
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

// Strict admin middleware - use this when you want to enforce admin role
const strictAdminProtected = AsyncHandler(async (req, res, next) => {
    console.log('Strict admin check - Session data:', req.session);
    
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
            console.error('Error in strict admin middleware:', error);
        }
    } else {
        console.log('No session data for strict admin check');
    }

    return next(new ErrorResponse("Unauthorized. Please log in as admin.", 401));
});

export { protect, adminProtected, strictAdminProtected };