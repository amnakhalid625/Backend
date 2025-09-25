import AsyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";
import UserModel from "../models/userModel.js";
import User from "../models/userModel.js";

export const signUp = AsyncHandler(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(
                new ErrorResponse("Please provide all required fields", 400)
            );
        }

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return next(new ErrorResponse("User already exists", 400));
        }

        const user = await UserModel.create({ name, email, password });

        if (!user) {
            return next(new ErrorResponse("Failed to create user", 500));
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully! Please log in.",
        });
    } catch (error) {
        console.log("ERROR IN SIGN-UP : ", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

export const signIn = AsyncHandler(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(
                new ErrorResponse("Please provide all required fields", 400)
            );
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return next(new ErrorResponse("Invalid email or password", 401));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new ErrorResponse("Invalid email or password", 401));
        }

        // Set session data with explicit save
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return next(new ErrorResponse('Session error', 500));
            }
            
            console.log('Session saved successfully:', req.session.user);
            
            res.status(200).json({
                success: true,
                message: "User login successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        });
    } catch (error) {
        console.log("ERROR IN SIGN-IN : ", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

export const logout = AsyncHandler(async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Session destroy error:', err);
                return next(
                    new ErrorResponse(
                        "Something went wrong during logging out!",
                        500
                    )
                );
            }

            res.clearCookie("admin.session"); // Match the session name from server.js
            res.clearCookie("connect.sid"); // Fallback for old sessions
            return res.status(200).json({
                success: true,
                message: "User logged out successfully.",
            });
        });
    } catch (error) {
        console.log("ERROR IN LOGOUT : ", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

export const adminSignUp = AsyncHandler(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(new ErrorResponse("Please provide all required fields", 400));
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return next(new ErrorResponse("User already exists", 400));
        }

        const user = await UserModel.create({ 
            name, 
            email, 
            password, 
            role: 'admin' 
        });

        if (!user) {
            return next(new ErrorResponse("Failed to create admin user", 500));
        }

        res.status(201).json({
            success: true,
            message: "Admin user registered successfully! Please log in.",
        });
    } catch (error) {
        console.log("ERROR IN ADMIN SIGNUP : ", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// FIXED: Enhanced admin login with better session handling
export const adminLogin = AsyncHandler(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        console.log('\n=== ADMIN LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Session ID before login:', req.sessionID);

        if (!email || !password) {
            return next(new ErrorResponse("Please provide email and password", 400));
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found for email:', email);
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        if (user.role !== "admin") {
            console.log('User is not admin. Role:', user.role);
            return next(new ErrorResponse("Not authorized as admin", 403));
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        // Clear any existing session first
        if (req.session.user) {
            console.log('Clearing existing session data');
            delete req.session.user;
        }

        // Set new session data
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        console.log('Setting session user:', req.session.user);

        // Force session save and send response
        req.session.save((err) => {
            if (err) {
                console.error('Admin session save error:', err);
                return next(new ErrorResponse('Session error', 500));
            }
            
            console.log('✅ Admin session saved successfully');
            console.log('Session ID after save:', req.sessionID);
            console.log('Session user after save:', req.session.user);
            
            // Send success response
            res.status(200).json({
                success: true,
                message: "Admin logged in successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                sessionId: req.sessionID // Include session ID for debugging
            });
        });
    } catch (error) {
        console.log("ERROR IN ADMIN LOGIN:", error.message);
        return next(new ErrorResponse("Internal Server Error!", 500));
    }
});

// Add a session check endpoint for debugging
export const checkSession = AsyncHandler(async (req, res, next) => {
    console.log('\n=== SESSION CHECK ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('User in session:', req.session?.user);
    
    res.json({
        sessionId: req.sessionID,
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        user: req.session?.user || null,
        isAdmin: req.session?.user?.role === 'admin'
    });
});