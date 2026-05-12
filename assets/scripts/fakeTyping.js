/**
 * FAKE TYPING PERSONALITY — Farzon Character Layer
 * 
 * Occasionally makes Farzon's typing feel more human:
 *   typing → pause → resume → respond
 * 
 * Happens rarely, unpredictably, and only on suitable replies.
 * Adds ~600-900ms total when triggered — never feels slow.
 * 
 * Future-ready: structured for voice reactions, sound effects,
 * advanced personality hooks. Do NOT implement those now.
 */

const FakeTyping = (() => {

    // ─── Config ──────────────────────────────────────────
    const CONFIG = {
        baseChance: 0.12,           // 12% base trigger rate
        boostedChance: 0.25,        // 25% for playful content
        cooldownMs: 45000,          // 45s minimum between triggers
        maxConsecutiveSkips: 8,     // After 8 skips, slightly boost odds
    };

    // ─── Typing Patterns ────────────────────────────────
    // Each pattern: pause (no dots) → resume typing → then respond
    // Total added time per pattern: 550–900ms
    const patterns = [
        { pause: 280, resume: 380 },   // Quick hesitation
        { pause: 350, resume: 450 },   // Thinking moment
        { pause: 220, resume: 500 },   // Double-take
        { pause: 400, resume: 350 },   // Slow start, quick finish
    ];

    // ─── Playful content signals ─────────────────────────
    const playfulSignals = [
        '😎', '😂', '🤔', '😭', '😤', '🔥', '💪', '⚡', '👀',
        'يا معلم', 'يا نجم', 'يا فرزاوي', 'يا غالي',
        'يرخم', 'بصراحة', 'والله', 'عاش',
        'هات من الاخر', 'بص يا سيدي',
    ];

    // ─── State ───────────────────────────────────────────
    let lastTriggeredAt = 0;
    let skipCount = 0;

    // ─── Core Logic ──────────────────────────────────────

    /**
     * Determine whether fake typing should trigger for this reply.
     * Analyzes reply content + randomization + cooldown.
     */
    function shouldUse(replyText) {
        if (!replyText) return false;

        // Cooldown guard
        const now = Date.now();
        if (now - lastTriggeredAt < CONFIG.cooldownMs) return false;

        // Determine chance
        const isPlayful = playfulSignals.some(s => replyText.includes(s));
        let chance = isPlayful ? CONFIG.boostedChance : CONFIG.baseChance;

        // Slight boost after many consecutive skips (prevents long dry spells)
        if (skipCount >= CONFIG.maxConsecutiveSkips) {
            chance = Math.min(chance + 0.10, 0.35);
        }

        const triggered = Math.random() < chance;

        if (triggered) {
            lastTriggeredAt = now;
            skipCount = 0;
        } else {
            skipCount++;
        }

        return triggered;
    }

    /**
     * Pick a random typing pattern.
     */
    function getPattern() {
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    /**
     * Execute the fake typing sequence.
     * 
     * Flow: remove dots → brief pause → show dots again → pause → remove → done.
     * Caller is responsible for showing typing BEFORE calling this.
     * 
     * @param {Function} showFn  - showLoading()
     * @param {Function} removeFn - removeLoading()
     * @returns {Promise<void>} resolves when the sequence is complete
     */
    function execute(showFn, removeFn) {
        const pattern = getPattern();

        return new Promise(resolve => {
            // Step 1: Remove typing (the "pause")
            removeFn();

            // Step 2: After pause, resume typing
            setTimeout(() => {
                showFn();

                // Step 3: After resumed typing, finish
                setTimeout(() => {
                    removeFn();
                    resolve();
                }, pattern.resume);

            }, pattern.pause);
        });
    }

    // ─── Public API ──────────────────────────────────────
    return { shouldUse, execute, getPattern };
})();
