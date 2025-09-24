export const adminLogin = AsyncHandler(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(
                new ErrorResponse("Please provide email and password", 400)
            );
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        // Check if user is admin
        if (user.role !== "admin") {
            return next(new ErrorResponse("Not authorized as admin", 403));
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        // Set session data with explicit save - ADD NAME HERE
        req.session.user = {
            id: user._id,
            name: user.name,  // ✅ Add this line
            email: user.email,
            role: user.role,
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Admin session save error:', err);
                return next(new ErrorResponse('Session error', 500));
            }
            
            console.log('Admin session saved successfully:', req.session.user);
            
            res.status(200).json({
                success: true,
                message: "Admin logged in successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        });
    } catch (error) {
        console.log("ERROR IN ADMIN LOGIN : ", error.message);
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
export const logout = AsyncHandler(async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return next(
                    new ErrorResponse(
                        "Something went wrong during logging out!",
                        500
                    )
                );
            }

            res.clearCookie("sessionId"); // Match session name from index.js
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