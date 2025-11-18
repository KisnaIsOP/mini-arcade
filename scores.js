/**
 * Mini Arcade Scores Database Helper
 * 
 * This module handles score persistence to Supabase database and provides
 * hybrid leaderboard functionality (local + database scores).
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase anon key
 * - IS_DEMO: Set to 'false' for production database saving
 * 
 * Features:
 * - Save scores to Supabase database when IS_DEMO=false
 * - Fetch top scores/leaderboards from database
 * - Hybrid local + database leaderboard display
 * - Graceful fallback to local scores if database unavailable
 * - Input validation and error handling
 */

// Import configuration from supabase.js
const IS_DEMO = window.IS_DEMO ?? true;
const getEnvVar = (name, fallback = '') => {
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
};

class ScoresDatabase {
    constructor() {
        this.supabase = null;
        this.SUPABASE_URL = getEnvVar('SUPABASE_URL', '');
        this.SUPABASE_ANON_KEY = getEnvVar('SUPABASE_KEY', '');
        
        this.initSupabase();
        
        console.log(`MINI-ARCADE: Scores database ${IS_DEMO ? 'DISABLED (demo mode)' : 'ENABLED'}`);
    }

    /**
     * Initialize Supabase client for database operations
     */
    initSupabase() {
        if (IS_DEMO) {
            console.log('MINI-ARCADE: Scores database disabled in demo mode (set IS_DEMO=false for production)');
            return;
        }

        try {
            if (typeof window.supabase === 'undefined') {
                console.warn('MINI-ARCADE: Supabase client not loaded, scores will only be saved locally');
                return;
            }

            if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
                console.warn('MINI-ARCADE: Missing Supabase credentials, scores will only be saved locally');
                return;
            }

            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            console.log('MINI-ARCADE: Scores database client initialized');
        } catch (error) {
            console.error('MINI-ARCADE: Failed to initialize scores database:', error);
        }
    }

    /**
     * Save a score to the database and local storage
     * @param {string} game - Game name (reaction, clickspeed, aimtrainer, memory)
     * @param {string} username - Player username
     * @param {number} score - Game score
     * @param {object} meta - Additional metadata (optional)
     * @returns {Promise<object>} - Save result
     */
    async saveScore(game, username, score, meta = {}) {
        // Always save to local storage first
        this.saveScoreLocally(game, username, score, meta);

        // Skip database save in demo mode
        if (IS_DEMO || !this.supabase) {
            console.log(`MINI-ARCADE: Score saved locally only (demo mode): ${username} - ${score} in ${game}`);
            return { success: true, local: true, database: false, mode: 'demo' };
        }

        try {
            // Validate input
            const validation = this.validateScore(game, username, score);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            console.log(`MINI-ARCADE: Saving score to database: ${username} - ${score} in ${game}`);

            // Insert score into database
            const { data, error } = await this.supabase
                .from('scores')
                .insert([{
                    game,
                    username,
                    score,
                    meta: meta || {}
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('MINI-ARCADE: Score saved successfully to database');
            return { 
                success: true, 
                local: true, 
                database: true, 
                mode: 'production',
                data: data 
            };

        } catch (error) {
            console.error('MINI-ARCADE: Failed to save score to database:', error);
            
            // Return success for local save even if database fails
            return { 
                success: true, 
                local: true, 
                database: false, 
                mode: 'production',
                error: error.message 
            };
        }
    }

    /**
     * Save score to local storage (fallback/backup)
     */
    saveScoreLocally(game, username, score, meta) {
        try {
            // Save to the existing local storage format
            const recentKey = `${game}Recent`;
            const bestKey = `${game}Best`;
            
            // Get existing scores
            const recentScores = JSON.parse(localStorage.getItem(recentKey) || '[]');
            const currentBest = localStorage.getItem(bestKey);
            
            // Add to recent scores
            recentScores.unshift({ score, username, meta, timestamp: Date.now() });
            if (recentScores.length > 5) {
                recentScores.pop();
            }
            localStorage.setItem(recentKey, JSON.stringify(recentScores));
            
            // Update best score if applicable
            const isNewBest = this.isNewBestScore(game, score, currentBest);
            if (isNewBest) {
                localStorage.setItem(bestKey, score.toString());
            }
            
        } catch (error) {
            console.error('MINI-ARCADE: Failed to save score locally:', error);
        }
    }

    /**
     * Check if score is a new best
     */
    isNewBestScore(game, score, currentBest) {
        if (!currentBest) return true;
        
        const current = parseFloat(currentBest);
        
        // For reaction and memory games, lower is better
        if (game === 'reaction' || game === 'memory') {
            return score < current;
        }
        
        // For clickspeed and aimtrainer, higher is better
        return score > current;
    }

    /**
     * Fetch top scores for a game from database
     * @param {string} game - Game name
     * @param {number} limit - Number of scores to fetch (default 10)
     * @returns {Promise<object>} - Fetch result with scores
     */
    async fetchTopScores(game, limit = 10) {
        // Always return local scores in demo mode
        if (IS_DEMO || !this.supabase) {
            console.log(`MINI-ARCADE: Fetching local scores only (demo mode): ${game}`);
            return this.getLocalTopScores(game, limit);
        }

        try {
            console.log(`MINI-ARCADE: Fetching top ${limit} scores for ${game} from database`);

            const { data, error } = await this.supabase
                .rpc('get_top_scores', {
                    game_name: game,
                    score_limit: limit
                });

            if (error) {
                throw error;
            }

            console.log(`MINI-ARCADE: Fetched ${data?.length || 0} scores from database`);
            
            return {
                success: true,
                scores: data || [],
                source: 'database',
                mode: 'production'
            };

        } catch (error) {
            console.error('MINI-ARCADE: Failed to fetch scores from database:', error);
            
            // Fallback to local scores
            const localResult = this.getLocalTopScores(game, limit);
            return {
                ...localResult,
                fallback: true,
                error: error.message
            };
        }
    }

    /**
     * Get top scores from local storage (fallback)
     */
    getLocalTopScores(game, limit = 10) {
        try {
            const recentKey = `${game}Recent`;
            const recentScores = JSON.parse(localStorage.getItem(recentKey) || '[]');
            
            // Sort scores appropriately for each game type
            const sortedScores = recentScores.sort((a, b) => {
                if (game === 'reaction' || game === 'memory') {
                    return a.score - b.score; // Lower is better
                } else {
                    return b.score - a.score; // Higher is better
                }
            });

            const formattedScores = sortedScores.slice(0, limit).map((score, index) => ({
                username: score.username || 'Local Player',
                score: score.score,
                meta: score.meta || {},
                created_at: new Date(score.timestamp || Date.now()).toISOString(),
                rank: index + 1
            }));

            return {
                success: true,
                scores: formattedScores,
                source: 'local',
                mode: IS_DEMO ? 'demo' : 'production'
            };

        } catch (error) {
            console.error('MINI-ARCADE: Failed to get local scores:', error);
            return {
                success: false,
                scores: [],
                source: 'local',
                mode: IS_DEMO ? 'demo' : 'production',
                error: error.message
            };
        }
    }

    /**
     * Get hybrid leaderboard (local recent + database top)
     * @param {string} game - Game name
     * @returns {Promise<object>} - Hybrid leaderboard data
     */
    async getHybridLeaderboard(game) {
        try {
            // Get local recent scores
            const localScores = this.getLocalTopScores(game, 5);
            
            // Get database top scores (if available and not in demo mode)
            const databaseScores = await this.fetchTopScores(game, 10);
            
            return {
                success: true,
                local: localScores,
                database: databaseScores,
                hybrid: true,
                mode: IS_DEMO ? 'demo' : 'production'
            };

        } catch (error) {
            console.error('MINI-ARCADE: Failed to create hybrid leaderboard:', error);
            
            // Return only local scores on error
            return {
                success: true,
                local: this.getLocalTopScores(game, 5),
                database: { success: false, scores: [], source: 'database' },
                hybrid: false,
                mode: IS_DEMO ? 'demo' : 'production',
                error: error.message
            };
        }
    }

    /**
     * Get user's best score for a game
     * @param {string} game - Game name
     * @param {string} username - Player username
     * @returns {Promise<object>} - User's best score
     */
    async getUserBestScore(game, username) {
        if (IS_DEMO || !this.supabase) {
            return this.getLocalUserBest(game, username);
        }

        try {
            const { data, error } = await this.supabase
                .rpc('get_user_best_score', {
                    game_name: game,
                    user_name: username
                });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                return {
                    success: true,
                    score: data[0],
                    source: 'database',
                    mode: 'production'
                };
            }

            // No database score found, check local
            return this.getLocalUserBest(game, username);

        } catch (error) {
            console.error('MINI-ARCADE: Failed to get user best score:', error);
            return this.getLocalUserBest(game, username);
        }
    }

    /**
     * Get user's best score from local storage
     */
    getLocalUserBest(game, username) {
        try {
            const bestKey = `${game}Best`;
            const best = localStorage.getItem(bestKey);
            
            if (best) {
                return {
                    success: true,
                    score: {
                        score: parseFloat(best),
                        meta: {},
                        created_at: new Date().toISOString()
                    },
                    source: 'local',
                    mode: IS_DEMO ? 'demo' : 'production'
                };
            }

            return {
                success: false,
                message: 'No local best score found',
                source: 'local',
                mode: IS_DEMO ? 'demo' : 'production'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'local',
                mode: IS_DEMO ? 'demo' : 'production'
            };
        }
    }

    /**
     * Validate score data before saving
     */
    validateScore(game, username, score) {
        // Validate game type
        const validGames = ['reaction', 'clickspeed', 'aimtrainer', 'memory'];
        if (!validGames.includes(game)) {
            return { valid: false, error: `Invalid game type: ${game}` };
        }

        // Validate username
        if (!username || typeof username !== 'string' || username.trim().length < 1) {
            return { valid: false, error: 'Username is required' };
        }

        if (username.length > 50) {
            return { valid: false, error: 'Username too long (max 50 characters)' };
        }

        // Validate score
        if (typeof score !== 'number' || score < 0) {
            return { valid: false, error: 'Score must be a positive number' };
        }

        // Game-specific score validation
        switch (game) {
            case 'reaction':
                if (score < 50 || score > 10000) {
                    return { valid: false, error: 'Reaction time must be between 50-10000ms' };
                }
                break;
            case 'clickspeed':
                if (score > 50) {
                    return { valid: false, error: 'Click speed cannot exceed 50 CPS' };
                }
                break;
            case 'aimtrainer':
                if (score > 1000) {
                    return { valid: false, error: 'Aim score cannot exceed 1000 points' };
                }
                break;
            case 'memory':
                if (score < 5 || score > 600) {
                    return { valid: false, error: 'Memory time must be between 5-600 seconds' };
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Get database health status
     * @returns {Promise<object>} - Health check result
     */
    async healthCheck() {
        if (IS_DEMO || !this.supabase) {
            return {
                status: 'demo_mode',
                database: false,
                local: true,
                mode: 'demo'
            };
        }

        try {
            const { data, error } = await this.supabase.rpc('health_check');

            if (error) {
                throw error;
            }

            return {
                status: 'healthy',
                database: true,
                local: true,
                mode: 'production',
                data: data
            };

        } catch (error) {
            return {
                status: 'error',
                database: false,
                local: true,
                mode: 'production',
                error: error.message
            };
        }
    }
}

// Create global instance
const scoresInstance = new ScoresDatabase();

// Export functions for global use
window.saveScore = (game, username, score, meta) => scoresInstance.saveScore(game, username, score, meta);
window.fetchTopScores = (game, limit) => scoresInstance.fetchTopScores(game, limit);
window.getHybridLeaderboard = (game) => scoresInstance.getHybridLeaderboard(game);
window.getUserBestScore = (game, username) => scoresInstance.getUserBestScore(game, username);

// For debugging in console
window.scoresDebug = {
    healthCheck: () => scoresInstance.healthCheck(),
    saveTestScore: (game, score) => scoresInstance.saveScore(game, 'TestPlayer', score, { test: true }),
    fetchTop: (game) => scoresInstance.fetchTopScores(game),
    getHybrid: (game) => scoresInstance.getHybridLeaderboard(game),
    validateScore: (game, username, score) => scoresInstance.validateScore(game, username, score),
    isDemo: () => IS_DEMO,
    config: () => ({
        IS_DEMO: IS_DEMO,
        hasSupabase: !!scoresInstance.supabase,
        supabaseUrl: scoresInstance.SUPABASE_URL ? scoresInstance.SUPABASE_URL.replace(/.*\/\/([^.]+)\./, '$1...') : 'not set'
    })
};

console.log('MINI-ARCADE: Scores database helper loaded');
console.log(`MINI-ARCADE: Mode: ${IS_DEMO ? 'DEMO (local only)' : 'PRODUCTION (database enabled)'}`);
console.log('MINI-ARCADE: Type "scoresDebug" in console for debugging tools');