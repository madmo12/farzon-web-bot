/**
 * ACHIEVEMENTS / BADGES SYSTEM — Farzon Gamification Layer
 * 
 * Lightweight progression system with backend persistence.
 * 
 * Architecture:
 *   - localStorage = instant cache (for fast checks on load)
 *   - Backend MongoDB = persistent source of truth
 *   - Frontend = sole owner of unlock logic & UI
 * 
 * Sync flow:
 *   1. Init: load localStorage instantly → fetch backend stats in background
 *   2. Merge: take max(local, backend) for each counter
 *   3. Track: update local instantly, backend syncs via existing flows
 *      - Messages: piggybacked on /api/ask (zero extra requests)
 *      - Games: POST /api/stats/track (fire-and-forget)
 *      - Visits: tracked by both backend and frontend independently
 * 
 * Future-ready: structured for rare, seasonal, XP, sound effects.
 * Do NOT implement those now.
 */

const Achievements = (() => {

    // ─── Storage Keys ────────────────────────────────────
    const STORAGE_KEY    = 'farzon_achievements';
    const STATS_KEY      = 'farzon_stats';
    const LAST_VISIT_KEY = 'farzon_last_visit';
    const API_BASE       = '/api';

    // ─── Achievement Definitions ─────────────────────────
    // category: 'default' — future: 'rare', 'seasonal', 'event'
    // Rarity tiers — used for badge styling in gallery
    const RARITY = { COMMON: 'common', RARE: 'rare', EPIC: 'epic', LEGENDARY: 'legendary' };
    const RARITY_LABELS = { common: 'عادي', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' };

    const definitions = [
        {
            id: 'first_visit',
            name: 'أول زيارة 👋',
            description: 'زرت فرزون لأول مرة',
            unlockMsg: 'أهلاً بيك! دي أول زيارة ليك 🎉',
            rarity: RARITY.COMMON,
            check: (s) => s.total_visits >= 1,
        },
        {
            id: 'farzawi_new',
            name: 'فرزاوي جديد 😏',
            description: 'بعتت 5 رسايل',
            unlockMsg: 'واضح إنك بدأت تتعلق بفرزون 👀',
            rarity: RARITY.COMMON,
            check: (s) => s.total_messages >= 5,
        },
        {
            id: 'curious',
            name: 'فضولي زيادة 👀',
            description: 'بعتت 15 رسالة',
            unlockMsg: 'بتسأل كتير... عجبتني 😏',
            rarity: RARITY.RARE,
            check: (s) => s.total_messages >= 15,
        },
        {
            id: 'xo_player',
            name: 'لاعب X/O 🎮',
            description: 'لعبت أول لعبة X/O',
            unlockMsg: 'يلاعب! فرزون مستنيك المرة الجاية 🔥',
            rarity: RARITY.RARE,
            check: (s) => s.total_games >= 1,
        },
        {
            id: 'silver',
            name: 'فرزاوي فضي 🥈',
            description: 'زرت فرزون 3 مرات',
            unlockMsg: 'رجعت تاني وتالت... حلو 😏',
            rarity: RARITY.EPIC,
            check: (s) => s.total_visits >= 3,
        },
        {
            id: 'legendary',
            name: 'فرزاوي أسطوري 🔥',
            description: 'بعتت 50 رسالة وزرت 5 مرات',
            unlockMsg: 'انت بقيت أسطورة هنا بصراحة 🔥',
            rarity: RARITY.LEGENDARY,
            check: (s) => s.total_messages >= 50 && s.total_visits >= 5,
        },
    ];

    // ─── State ───────────────────────────────────────────
    let stats = { total_visits: 0, total_messages: 0, total_games: 0 };
    let unlocked = [];          // [{ id, unlockedAt }]
    let toastQueue = [];
    let isShowingToast = false;

    // ─── Local Persistence ───────────────────────────────

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STATS_KEY);
            if (raw) stats = JSON.parse(raw);
            const rawA = localStorage.getItem(STORAGE_KEY);
            if (rawA) unlocked = JSON.parse(rawA);
        } catch (e) {
            console.warn('Achievements: local load failed', e);
        }
    }

    function saveLocal() {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
        } catch (e) {
            console.warn('Achievements: local save failed', e);
        }
    }

    // ─── Backend Sync ────────────────────────────────────

    function getSessionId() {
        return localStorage.getItem('farzon_session') || null;
    }

    /**
     * Fetch stats from backend and merge with local cache.
     * Takes the MAX of each counter (handles offline usage gracefully).
     */
    async function syncFromBackend() {
        const sid = getSessionId();
        if (!sid) return;

        try {
            const res = await fetch(`${API_BASE}/stats/${sid}`);
            if (!res.ok) return;

            const remote = await res.json();

            // Merge: take max of local vs backend for each counter
            stats.total_visits   = Math.max(stats.total_visits,   remote.visits || 0);
            stats.total_messages = Math.max(stats.total_messages, remote.messages || 0);
            stats.total_games    = Math.max(stats.total_games,    remote.gamesPlayed || 0);

            saveLocal();

            // Re-check achievements with merged data
            checkAndUnlock();
        } catch (e) {
            // Backend unavailable — local cache is still valid
            console.warn('Achievements: backend sync failed (using local)', e);
        }
    }

    /**
     * Send a game event to backend (fire-and-forget).
     * @param {'game_win'|'game_loss'|'game_draw'} event
     */
    function sendGameEvent(event) {
        const sid = getSessionId();
        if (!sid) return;

        fetch(`${API_BASE}/stats/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sid, event })
        }).catch(() => {
            // Silent fail — local stats are still accurate
        });
    }

    // ─── Core Logic ──────────────────────────────────────

    function isUnlocked(id) {
        return unlocked.some(a => a.id === id);
    }

    function checkAndUnlock() {
        for (const def of definitions) {
            if (!isUnlocked(def.id) && def.check(stats)) {
                unlocked.push({ id: def.id, unlockedAt: Date.now() });
                saveLocal();
                queueToast(def);
            }
        }
    }

    /**
     * Track an interaction event.
     * @param {'visit'|'message'|'game'} event
     * @param {Object} [data] - Optional data (e.g. { result: 'win' })
     */
    function track(event, data) {
        switch (event) {
            case 'visit':
                const today = new Date().toDateString();
                const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
                if (lastVisit !== today) {
                    stats.total_visits++;
                    localStorage.setItem(LAST_VISIT_KEY, today);
                }
                break;
            case 'message':
                stats.total_messages++;
                // Backend tracks messages via /api/ask — no extra request needed
                break;
            case 'game':
                stats.total_games++;
                // Send game result to backend (fire-and-forget)
                if (data && data.result) {
                    const eventMap = { win: 'game_win', loss: 'game_loss', draw: 'game_draw' };
                    const backendEvent = eventMap[data.result];
                    if (backendEvent) sendGameEvent(backendEvent);
                }
                break;
            default:
                return;
        }
        saveLocal();
        // Defer unlock check to avoid blocking UI
        setTimeout(() => checkAndUnlock(), 150);
    }

    // ─── Toast Queue ─────────────────────────────────────

    function queueToast(achievement) {
        toastQueue.push(achievement);
        if (!isShowingToast) processQueue();
    }

    function processQueue() {
        if (toastQueue.length === 0) {
            isShowingToast = false;
            return;
        }
        isShowingToast = true;
        const next = toastQueue.shift();
        renderToast(next);
    }

    // ─── Toast Renderer ──────────────────────────────────

    function renderToast(achievement) {
        const container = document.querySelector('.chat-container');
        if (!container) { isShowingToast = false; return; }

        // Cleanup stale toast
        const old = container.querySelector('.achievement-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="achievement-toast-icon">🏆</div>
            <div class="achievement-toast-body">
                <div class="achievement-toast-label">إنجاز جديد!</div>
                <div class="achievement-toast-name">${achievement.name}</div>
                <div class="achievement-toast-msg">${achievement.unlockMsg}</div>
            </div>
        `;

        container.appendChild(toast);

        // Trigger enter animation on next frame
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss after 4.5s
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
                processQueue();
            }, 450);
        }, 4500);
    }

    // ─── Init ────────────────────────────────────────────

    function init() {
        loadLocal();
        track('visit');
        // Background sync from backend (non-blocking)
        setTimeout(() => syncFromBackend(), 800);
    }

    /**
     * Get all achievements with unlock status.
     */
    function getAll() {
        return definitions.map(def => ({
            id: def.id,
            name: def.name,
            description: def.description,
            rarity: def.rarity,
            rarityLabel: RARITY_LABELS[def.rarity],
            unlocked: isUnlocked(def.id),
            unlockedAt: (unlocked.find(a => a.id === def.id) || {}).unlockedAt || null,
        }));
    }

    // ─── Gallery Modal ───────────────────────────────────

    // Mystery text for locked achievements — personality-driven
    const LOCKED_TEASERS = [
        'إنجاز غامض 👀',
        'لسه قدامك شوية 😏',
        '؟؟؟ 🔒',
        'كمّل وهتعرف 🤫',
        'مستخبي ليك حاجة 😏',
        'خليك فضولي 👀',
    ];
    let _teaserIdx = 0;
    function getLockedTeaser() {
        const t = LOCKED_TEASERS[_teaserIdx % LOCKED_TEASERS.length];
        _teaserIdx++;
        return t;
    }

    function openGallery() {
        // Prevent duplicate modals
        const existing = document.getElementById('achievement-gallery-overlay');
        if (existing) { existing.classList.add('active'); return; }

        _teaserIdx = 0; // Reset teaser rotation
        const all = getAll();
        const unlockedCount = all.filter(a => a.unlocked).length;

        const overlay = document.createElement('div');
        overlay.id = 'achievement-gallery-overlay';
        overlay.className = 'achievement-gallery-overlay';

        overlay.innerHTML = `
            <div class="achievement-gallery">
                <div class="achievement-gallery-header">
                    <h3>🏆 الإنجازات</h3>
                    <span class="achievement-gallery-count">${unlockedCount} / ${all.length}</span>
                    <button class="close-btn" id="close-gallery-btn">&times;</button>
                </div>
                <div class="achievement-gallery-progress">
                    <div class="achievement-gallery-bar">
                        <div class="achievement-gallery-bar-fill" style="width: ${(unlockedCount / all.length) * 100}%"></div>
                    </div>
                </div>
                <div class="achievement-gallery-grid">
                    ${all.map(a => `
                        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'} rarity-${a.rarity}">
                            <div class="achievement-card-icon">${a.unlocked ? a.name.slice(-2) : '🔒'}</div>
                            <div class="achievement-card-body">
                                <div class="achievement-card-name">${a.unlocked ? a.name : '???'}</div>
                                <div class="achievement-card-desc">${a.unlocked ? a.description : getLockedTeaser()}</div>
                                <div class="achievement-card-rarity rarity-${a.rarity}">${a.rarityLabel}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const container = document.querySelector('.chat-container');
        if (!container) return;
        container.appendChild(overlay);

        // Enter animation
        requestAnimationFrame(() => overlay.classList.add('active'));

        // Close handlers
        const closeBtn = overlay.querySelector('#close-gallery-btn');
        closeBtn.addEventListener('click', () => closeGallery(overlay));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeGallery(overlay);
        });
    }

    function closeGallery(overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }

    // ─── Public API ──────────────────────────────────────
    return { init, track, getAll, openGallery };

})();
