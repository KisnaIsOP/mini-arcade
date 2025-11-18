/**
 * Mini Arcade Authentication System
 * 
 * A lightweight client-side authentication system for demo purposes.
 * 
 * SECURITY NOTE: This is a demonstration implementation using client-side
 * password hashing and localStorage. For production applications, use proper
 * authentication services like Supabase Auth, Firebase Auth, or Auth0.
 * 
 * Features:
 * - Client-side password hashing with Web Crypto API (SHA-256)
 * - User registration and login
 * - Session management with localStorage
 * - Input validation and error handling
 */

class MiniArcadeAuth {
    constructor() {
        this.USERS_KEY = 'miniArcade_users';
        this.SESSION_KEY = 'miniArcade_currentUser';
    }

    /**
     * Hash password using Web Crypto API SHA-256
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password in hex format
     */
    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} - Validation result
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }

        if (password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters long' };
        }

        if (password.length > 128) {
            return { valid: false, error: 'Password is too long (max 128 characters)' };
        }

        // Optional: Add more strength requirements
        // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        //     return { valid: false, error: 'Password must contain uppercase, lowercase, and number' };
        // }

        return { valid: true };
    }

    /**
     * Validate username
     * @param {string} username - Username to validate
     * @returns {object} - Validation result
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Username is required' };
        }

        const trimmed = username.trim();
        
        if (trimmed.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters long' };
        }

        if (trimmed.length > 20) {
            return { valid: false, error: 'Username must be 20 characters or less' };
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }

        return { valid: true, username: trimmed };
    }

    /**
     * Get all users from localStorage
     * @returns {Array} - Array of user objects
     */
    getUsers() {
        try {
            const users = localStorage.getItem(this.USERS_KEY);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Failed to retrieve users:', error);
            return [];
        }
    }

    /**
     * Save users to localStorage
     * @param {Array} users - Array of user objects
     */
    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Failed to save users:', error);
            throw new Error('Failed to save user data');
        }
    }

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {object|null} - User object or null if not found
     */
    findUser(username) {
        const users = this.getUsers();
        return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
    }

    /**
     * Generate a unique user ID
     * @returns {string} - Unique ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Promise<object>} - Registration result
     */
    async register(username, password) {
        try {
            // Validate username
            const usernameValidation = this.validateUsername(username);
            if (!usernameValidation.valid) {
                return { success: false, error: usernameValidation.error };
            }

            // Validate password
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.valid) {
                return { success: false, error: passwordValidation.error };
            }

            const cleanUsername = usernameValidation.username;

            // Check if user already exists
            if (this.findUser(cleanUsername)) {
                return { success: false, error: 'Username already exists. Please choose a different username.' };
            }

            // Hash password
            const hashedPassword = await this.hashPassword(password);

            // Create user object
            const newUser = {
                id: this.generateUserId(),
                username: cleanUsername,
                passwordHash: hashedPassword,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            // Save user
            const users = this.getUsers();
            users.push(newUser);
            this.saveUsers(users);

            console.log(`User registered successfully: ${cleanUsername}`);
            return { success: true, message: 'Account created successfully!' };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Promise<object>} - Login result
     */
    async login(username, password) {
        try {
            // Validate inputs
            if (!username || !password) {
                return { success: false, error: 'Username and password are required' };
            }

            // Find user
            const user = this.findUser(username.trim());
            if (!user) {
                return { success: false, error: 'Invalid username or password' };
            }

            // Hash provided password and compare
            const hashedPassword = await this.hashPassword(password);
            if (hashedPassword !== user.passwordHash) {
                return { success: false, error: 'Invalid username or password' };
            }

            // Update last login
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].lastLogin = new Date().toISOString();
                this.saveUsers(users);
            }

            // Create session
            const sessionUser = {
                id: user.id,
                username: user.username,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));

            console.log(`User logged in successfully: ${user.username}`);
            return { success: true, user: sessionUser, message: 'Login successful!' };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }

    /**
     * Logout current user
     * @returns {object} - Logout result
     */
    logout() {
        try {
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                console.log(`User logged out: ${currentUser.username}`);
            }
            
            localStorage.removeItem(this.SESSION_KEY);
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    }

    /**
     * Get current logged-in user
     * @returns {object|null} - Current user object or null
     */
    getCurrentUser() {
        try {
            const session = localStorage.getItem(this.SESSION_KEY);
            if (!session) return null;
            
            const user = JSON.parse(session);
            
            // Optional: Check session expiry (e.g., 24 hours)
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursSinceLogin > 24) {
                console.log('Session expired, logging out');
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Failed to get current user:', error);
            localStorage.removeItem(this.SESSION_KEY);
            return null;
        }
    }

    /**
     * Check if user is authenticated and redirect if not
     * @param {string} redirectUrl - URL to redirect to if not authenticated
     * @returns {boolean} - True if authenticated, false if redirected
     */
    requireAuth(redirectUrl = 'auth.html') {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            window.location.href = `${redirectUrl}?return=${encodeURIComponent(currentPage)}`;
            return false;
        }
        return true;
    }

    /**
     * Check if user is authenticated (without redirecting)
     * @returns {boolean} - True if authenticated
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Get user stats for debugging/admin purposes
     * @returns {object} - User statistics
     */
    getUserStats() {
        const users = this.getUsers();
        const currentUser = this.getCurrentUser();
        
        return {
            totalUsers: users.length,
            currentUser: currentUser ? currentUser.username : null,
            isAuthenticated: this.isAuthenticated()
        };
    }
}

// Create global instance
const authInstance = new MiniArcadeAuth();

// Export functions for global use
window.register = (username, password) => authInstance.register(username, password);
window.login = (username, password) => authInstance.login(username, password);
window.logout = () => authInstance.logout();
window.getCurrentUser = () => authInstance.getCurrentUser();
window.requireAuth = (redirectUrl) => authInstance.requireAuth(redirectUrl);
window.isAuthenticated = () => authInstance.isAuthenticated();

// For debugging in console
window.authDebug = {
    getUsers: () => authInstance.getUsers(),
    getUserStats: () => authInstance.getUserStats(),
    clearAllUsers: () => {
        localStorage.removeItem(authInstance.USERS_KEY);
        localStorage.removeItem(authInstance.SESSION_KEY);
        console.log('All auth data cleared');
    }
};

console.log('Mini Arcade Auth System loaded. Type authDebug in console for debugging tools.');