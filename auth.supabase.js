/**
 * Mini Arcade Supabase Authentication Integration
 * 
 * Optional Supabase Auth integration for production use.
 * This provides an alternative to the local auth system using Supabase's
 * built-in authentication features.
 * 
 * To enable Supabase Auth:
 * 1. Set USE_SUPABASE_AUTH=true in your environment variables
 * 2. Include this file in your HTML pages
 * 3. Update your auth flow to use these functions instead of local auth
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase anon key
 * - USE_SUPABASE_AUTH: Set to 'true' to enable
 * 
 * WARNING: Never commit actual credentials to version control!
 * Use environment variables or .env files that are gitignored.
 */

class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.useSupabaseAuth = this.getEnvVar('USE_SUPABASE_AUTH', 'false') === 'true';
        this.SUPABASE_URL = this.getEnvVar('SUPABASE_URL', '');
        this.SUPABASE_ANON_KEY = this.getEnvVar('SUPABASE_KEY', '');
        
        if (this.useSupabaseAuth) {
            this.initSupabase();
        }
        
        console.log(`MINI-ARCADE: Supabase Auth ${this.useSupabaseAuth ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Get environment variable with fallback
     */
    getEnvVar(name, fallback = '') {
        // Try multiple sources for environment variables
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            return process.env[name];
        }
        
        if (typeof window !== 'undefined' && window.env && window.env[name]) {
            return window.env[name];
        }
        
        if (typeof window !== 'undefined' && window[name]) {
            return window[name];
        }
        
        return fallback;
    }

    /**
     * Initialize Supabase client
     */
    initSupabase() {
        try {
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase client not loaded. Include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            }

            if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
                throw new Error('Missing Supabase credentials for auth');
            }

            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            console.log('MINI-ARCADE: Supabase Auth client initialized');
        } catch (error) {
            console.error('MINI-ARCADE: Failed to initialize Supabase Auth:', error);
            this.useSupabaseAuth = false;
        }
    }

    /**
     * Sign up with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {object} metadata - Additional user metadata (e.g., username)
     * @returns {Promise<object>} - Auth result
     */
    async signUp(email, password, metadata = {}) {
        if (!this.useSupabaseAuth || !this.supabase) {
            throw new Error('Supabase Auth not enabled');
        }

        try {
            console.log('MINI-ARCADE: Attempting Supabase signup for:', email);

            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: metadata.username || email.split('@')[0],
                        ...metadata
                    }
                }
            });

            if (error) {
                console.error('MINI-ARCADE: Signup error:', error);
                return { 
                    success: false, 
                    error: this.formatAuthError(error.message) 
                };
            }

            console.log('MINI-ARCADE: Signup successful');
            return { 
                success: true, 
                user: data.user,
                session: data.session,
                message: 'Account created! Check your email to confirm.' 
            };

        } catch (error) {
            console.error('MINI-ARCADE: Signup failed:', error);
            return { 
                success: false, 
                error: 'Signup failed. Please try again.' 
            };
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object>} - Auth result
     */
    async signIn(email, password) {
        if (!this.useSupabaseAuth || !this.supabase) {
            throw new Error('Supabase Auth not enabled');
        }

        try {
            console.log('MINI-ARCADE: Attempting Supabase signin for:', email);

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('MINI-ARCADE: Signin error:', error);
                return { 
                    success: false, 
                    error: this.formatAuthError(error.message) 
                };
            }

            console.log('MINI-ARCADE: Signin successful');
            return { 
                success: true, 
                user: data.user,
                session: data.session,
                message: 'Login successful!' 
            };

        } catch (error) {
            console.error('MINI-ARCADE: Signin failed:', error);
            return { 
                success: false, 
                error: 'Login failed. Please try again.' 
            };
        }
    }

    /**
     * Sign out current user
     * @returns {Promise<object>} - Auth result
     */
    async signOut() {
        if (!this.useSupabaseAuth || !this.supabase) {
            throw new Error('Supabase Auth not enabled');
        }

        try {
            console.log('MINI-ARCADE: Signing out from Supabase');

            const { error } = await this.supabase.auth.signOut();

            if (error) {
                console.error('MINI-ARCADE: Signout error:', error);
                return { 
                    success: false, 
                    error: 'Logout failed. Please try again.' 
                };
            }

            console.log('MINI-ARCADE: Signout successful');
            return { 
                success: true, 
                message: 'Logged out successfully' 
            };

        } catch (error) {
            console.error('MINI-ARCADE: Signout failed:', error);
            return { 
                success: false, 
                error: 'Logout failed. Please try again.' 
            };
        }
    }

    /**
     * Get current authenticated user
     * @returns {object|null} - Current user or null
     */
    async getUser() {
        if (!this.useSupabaseAuth || !this.supabase) {
            return null;
        }

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();

            if (error) {
                console.error('MINI-ARCADE: Get user error:', error);
                return null;
            }

            if (user) {
                return {
                    id: user.id,
                    email: user.email,
                    username: user.user_metadata?.username || user.email?.split('@')[0],
                    emailConfirmed: user.email_confirmed_at !== null,
                    createdAt: user.created_at,
                    lastSignIn: user.last_sign_in_at
                };
            }

            return null;

        } catch (error) {
            console.error('MINI-ARCADE: Failed to get user:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>} - True if authenticated
     */
    async isAuthenticated() {
        const user = await this.getUser();
        return user !== null;
    }

    /**
     * Listen for auth state changes
     * @param {function} callback - Callback function to handle auth state changes
     */
    onAuthStateChange(callback) {
        if (!this.useSupabaseAuth || !this.supabase) {
            console.warn('MINI-ARCADE: Supabase Auth not enabled for state change listener');
            return () => {}; // Return empty unsubscribe function
        }

        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('MINI-ARCADE: Auth state changed:', event, session?.user?.email);
                
                let user = null;
                if (session?.user) {
                    user = {
                        id: session.user.id,
                        email: session.user.email,
                        username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
                        emailConfirmed: session.user.email_confirmed_at !== null,
                        createdAt: session.user.created_at,
                        lastSignIn: session.user.last_sign_in_at
                    };
                }

                callback(event, user, session);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @returns {Promise<object>} - Reset result
     */
    async resetPassword(email) {
        if (!this.useSupabaseAuth || !this.supabase) {
            throw new Error('Supabase Auth not enabled');
        }

        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email);

            if (error) {
                console.error('MINI-ARCADE: Password reset error:', error);
                return { 
                    success: false, 
                    error: this.formatAuthError(error.message) 
                };
            }

            return { 
                success: true, 
                message: 'Password reset email sent!' 
            };

        } catch (error) {
            console.error('MINI-ARCADE: Password reset failed:', error);
            return { 
                success: false, 
                error: 'Password reset failed. Please try again.' 
            };
        }
    }

    /**
     * Format auth error messages for user display
     * @param {string} errorMessage - Raw error message
     * @returns {string} - Formatted error message
     */
    formatAuthError(errorMessage) {
        const errorMap = {
            'Invalid login credentials': 'Invalid email or password',
            'Email not confirmed': 'Please check your email and click the confirmation link',
            'User already registered': 'An account with this email already exists',
            'Password should be at least 6 characters': 'Password must be at least 6 characters long',
            'Unable to validate email address: invalid format': 'Please enter a valid email address',
            'signup is disabled': 'New registrations are currently disabled'
        };

        return errorMap[errorMessage] || errorMessage;
    }

    /**
     * Get auth configuration status
     * @returns {object} - Configuration status
     */
    getAuthConfig() {
        return {
            enabled: this.useSupabaseAuth,
            configured: Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY),
            clientInitialized: Boolean(this.supabase)
        };
    }
}

// Create global instance
const supabaseAuthInstance = new SupabaseAuth();

// Export functions for global use (only if Supabase Auth is enabled)
if (supabaseAuthInstance.useSupabaseAuth) {
    console.log('MINI-ARCADE: Registering Supabase Auth functions globally');
    
    // Override global auth functions with Supabase Auth
    window.supabaseSignUp = (email, password, metadata) => supabaseAuthInstance.signUp(email, password, metadata);
    window.supabaseSignIn = (email, password) => supabaseAuthInstance.signIn(email, password);
    window.supabaseSignOut = () => supabaseAuthInstance.signOut();
    window.supabaseGetUser = () => supabaseAuthInstance.getUser();
    window.supabaseIsAuthenticated = () => supabaseAuthInstance.isAuthenticated();
    window.supabaseOnAuthStateChange = (callback) => supabaseAuthInstance.onAuthStateChange(callback);
    window.supabaseResetPassword = (email) => supabaseAuthInstance.resetPassword(email);
} else {
    console.log('MINI-ARCADE: Supabase Auth disabled, using local auth system');
}

// For debugging in console
window.supabaseAuthDebug = {
    getConfig: () => supabaseAuthInstance.getAuthConfig(),
    getUser: () => supabaseAuthInstance.getUser(),
    isEnabled: () => supabaseAuthInstance.useSupabaseAuth,
    testSignIn: (email, password) => supabaseAuthInstance.signIn(email, password)
};

console.log('MINI-ARCADE: Supabase Auth integration loaded');
console.log('MINI-ARCADE: Type "supabaseAuthDebug" in console for debugging tools');

/**
 * MIGRATION GUIDE:
 * 
 * To switch from local auth to Supabase Auth:
 * 
 * 1. Set environment variable: USE_SUPABASE_AUTH=true
 * 
 * 2. Update your auth flow in auth.html:
 *    - Replace: await register(username, password)
 *    - With: await supabaseSignUp(email, password, { username })
 * 
 *    - Replace: await login(username, password)  
 *    - With: await supabaseSignIn(email, password)
 * 
 * 3. Update user checks:
 *    - Replace: getCurrentUser()
 *    - With: await supabaseGetUser()
 * 
 * 4. Set up auth state listener:
 *    supabaseOnAuthStateChange((event, user, session) => {
 *        if (event === 'SIGNED_IN') {
 *            // User signed in
 *        } else if (event === 'SIGNED_OUT') {
 *            // User signed out
 *        }
 *    });
 * 
 * 5. Configure Supabase Auth policies in your dashboard:
 *    - Enable email confirmation if desired
 *    - Set up RLS policies for your tables
 *    - Configure redirect URLs for email confirmations
 */