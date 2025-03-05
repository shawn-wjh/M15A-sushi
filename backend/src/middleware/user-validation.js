const authConfig = require('../config/auth');

/**
 * Input Validation Middleware
 */
const validation = {
    /**
     * Validate email format
     * Checks if email is in valid format
     */
    validateEmail: (req, res, next) => {
        try {
            const { email } = req.body;

            // Check if email is provided
            if (!email) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Email is required' 
                });
            }

            // Check email format using regex
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Invalid email format' 
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Error validating email' 
            });
        }
    },

    /**
     * Validate password meets requirements
     * Used for password changes and registration
     */
    validatePassword: (req, res, next) => {
        try {
            const { password } = req.body;
            
            // Check if password is provided
            if (!password) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Password is required' 
                });
            }
            
            //  Check length (minimum 8 characters)
            if (password.length < 8) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Password must be at least 8 characters long' 
                });
            }
            
            // 2. Check for uppercase
            if (!/[A-Z]/.test(password)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Password must contain at least one uppercase letter' 
                });
            }
            
            // 3. Check for numbers
            if (!/[0-9]/.test(password)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Password must contain at least one number' 
                });
            }
            
            // 4. Check for special characters
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Password must contain at least one special character' 
                });
            }
            
            next();
        } catch (error) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Error validating password' 
            });
        }
    }
};

module.exports = validation; 