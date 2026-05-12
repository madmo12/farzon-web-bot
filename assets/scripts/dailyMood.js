/**
 * DAILY MOOD SYSTEM — Farzon Personality Layer
 * 
 * Lightweight, frontend-only daily mood rotation.
 * Uses deterministic date-based seed so the mood stays
 * stable throughout the day and doesn't change on refresh.
 * 
 * Future-ready: structured for seasonal / rare / event moods.
 */

const DailyMood = (() => {

    // ─── Mood Pool ───────────────────────────────────────
    // category: 'default' — future categories: 'seasonal', 'rare', 'event'
    const moods = [
        { text: "فرزون النهاردة رايق 😌",          vibe: "chill"   },
        { text: "واضح إن الفرزون شارب قهوة زيادة ☕", vibe: "hyper"   },
        { text: "فرزون داخل يرخم النهاردة 😭",       vibe: "playful" },
        { text: "الفرزون مركز زيادة عن اللزوم 😤",    vibe: "focused" },
        { text: "فرزون شكله صاحي من بدري النهاردة 👀", vibe: "alert"   },
        { text: "واضح إن مود الفرزون عالي النهاردة 🔥", vibe: "fire"    },
        { text: "الفرزون جاي بطاقة غريبة النهاردة ⚡",  vibe: "energy"  },
        { text: "فرزون مبسوط النهاردة ومش عارف ليه 😂", vibe: "happy"   },
        { text: "الفرزون هادي أوي النهاردة 🌊",        vibe: "calm"    },
        { text: "فرزون جاي يكسر الدنيا النهاردة 💪",   vibe: "power"   },
    ];

    // ─── Deterministic Daily Seed ────────────────────────
    // Simple hash from date string → always the same index for a given day
    function getDaySeed() {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // ─── Public API ──────────────────────────────────────
    function getDailyMood() {
        const seed = getDaySeed();
        const index = seed % moods.length;
        return moods[index];
    }

    function render() {
        const mood = getDailyMood();
        const el = document.getElementById('daily-mood');
        if (!el) return;
        el.textContent = mood.text;
        el.setAttribute('data-vibe', mood.vibe);
    }

    return { getDailyMood, render };
})();
