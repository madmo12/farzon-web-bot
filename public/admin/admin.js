/**
 * FARZON ADMIN DASHBOARD — Frontend Logic
 * 
 * Handles: auth gate, tab switching, data fetching, rendering, charts.
 * Completely isolated from the chatbot frontend.
 */

(() => {
    'use strict';

    // ─── Config ──────────────────────────────────────────
    const API_BASE = '/api/admin';
    const STORAGE_KEY = 'farzon_admin_key';

    // ─── DOM Cache ───────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const authGate = $('#auth-gate');
    const authInput = $('#auth-input');
    const authBtn = $('#auth-btn');
    const authError = $('#auth-error');
    const dashboard = $('#dashboard');
    const tabNav = $('#tab-nav');
    const themeToggle = $('#theme-toggle');
    const refreshBtn = $('#refresh-btn');
    const logoutBtn = $('#logout-btn');

    let adminKey = sessionStorage.getItem(STORAGE_KEY) || '';
    let chartInstances = {};

    // ─── Auth ────────────────────────────────────────────

    function initAuth() {
        if (adminKey) {
            verifyKey(adminKey);
        }

        authBtn.addEventListener('click', () => {
            const key = authInput.value.trim();
            if (!key) { authError.textContent = 'ادخل كلمة السر'; return; }
            verifyKey(key);
        });

        authInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') authBtn.click();
        });
    }

    async function verifyKey(key) {
        try {
            const res = await fetch(`${API_BASE}/overview`, {
                headers: { 'x-admin-key': key }
            });
            if (res.ok) {
                adminKey = key;
                sessionStorage.setItem(STORAGE_KEY, key);
                showDashboard();
            } else {
                authError.textContent = 'كلمة السر غلط ❌';
                sessionStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            authError.textContent = 'السيرفر مش شغال ❌';
        }
    }

    function showDashboard() {
        authGate.classList.add('hidden');
        dashboard.classList.remove('hidden');
        loadTab('overview');
    }

    // ─── Theme ───────────────────────────────────────────

    function initTheme() {
        const saved = localStorage.getItem('farzon_admin_theme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('farzon_admin_theme', 'light');
                themeToggle.textContent = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('farzon_admin_theme', 'dark');
                themeToggle.textContent = '☀️';
            }
            // Rebuild charts with updated colors
            rebuildActiveCharts();
        });
    }

    // ─── Tabs ────────────────────────────────────────────

    function initTabs() {
        tabNav.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            $$('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            $$('.page').forEach(p => p.classList.remove('active'));
            $(`#page-${tabName}`).classList.add('active');
            loadTab(tabName);
        });
    }

    // ─── Top Bar Actions ─────────────────────────────────

    function initActions() {
        refreshBtn.addEventListener('click', () => {
            const activeTab = $('.tab.active')?.dataset.tab;
            if (activeTab) loadTab(activeTab, true);
        });

        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem(STORAGE_KEY);
            adminKey = '';
            dashboard.classList.add('hidden');
            authGate.classList.remove('hidden');
            authInput.value = '';
            authError.textContent = '';
        });
    }

    // ─── API Helper ──────────────────────────────────────

    async function api(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'x-admin-key': adminKey }
        });
        if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
        return res.json();
    }

    // ─── Tab Loaders ─────────────────────────────────────

    const loadedTabs = new Set();

    function loadTab(name, force = false) {
        if (loadedTabs.has(name) && !force) return;
        loadedTabs.add(name);

        switch (name) {
            case 'overview': loadOverview(); break;
            case 'unknown': loadUnknown(1); break;
            case 'analytics': loadAnalytics(); break;
            case 'achievements': loadAchievements(); break;
            case 'games': loadGames(); break;
            case 'users': loadUsers(1); break;
        }
    }

    // ─── Overview ────────────────────────────────────────

    async function loadOverview() {
        try {
            const data = await api('/overview');
            const u = data.users;
            const t = data.totals;

            $('#overview-cards').innerHTML = `
                ${statCard('👥', u.total, 'إجمالي المستخدمين', 'primary')}
                ${statCard('📩', t.messages, 'إجمالي الرسائل', 'accent')}
                ${statCard('👁️', t.visits, 'إجمالي الزيارات', 'primary')}
                ${statCard('🎮', t.games, 'ألعاب تم لعبها', 'warning')}
                ${statCard('🟢', u.activeLast24h, 'نشط خلال 24 ساعة', 'primary')}
                ${statCard('🆕', u.newLast7d, 'جدد آخر 7 أيام', 'accent')}
                ${statCard('❓', data.unknownQuestions, 'أسئلة بدون إجابة', 'danger')}
                ${statCard('🎯', t.ctaEngagements, 'تحويلات ناجحة', 'primary')}
            `;

            // Games donut chart
            renderDonut('chart-games', ['فوز', 'خسارة', 'تعادل'], [t.wins, t.losses, t.draws], ['#10B981', '#EF4444', '#F59E0B']);

            // Users bar chart
            renderBar('chart-users', ['إجمالي', 'نشط 24h', 'جدد 7d'], [u.total, u.activeLast24h, u.newLast7d], '#6366F1');

        } catch (e) {
            console.error('Overview load error:', e);
            $('#overview-cards').innerHTML = '<p style="color:var(--admin-danger)">فشل التحميل ❌</p>';
        }
    }

    // ─── Unknown Questions ───────────────────────────────

    async function loadUnknown(page) {
        try {
            const data = await api(`/unknown?page=${page}&limit=15`);
            const { questions, pagination } = data;

            $('#unknown-total').textContent = pagination.total;

            if (questions.length === 0) {
                $('#unknown-tbody').innerHTML = '<tr><td colspan="4" class="loading-cell">مفيش أسئلة حالياً 🎉</td></tr>';
            } else {
                $('#unknown-tbody').innerHTML = questions.map((q, i) => {
                    const idx = (pagination.page - 1) * pagination.limit + i + 1;
                    const countClass = q.count >= 5 ? '' : q.count >= 2 ? 'low' : 'single';
                    return `<tr>
                        <td>${idx}</td>
                        <td class="question-text">${escHtml(q.question)}</td>
                        <td><span class="count-badge ${countClass}">${q.count}</span></td>
                        <td>${formatDate(q.createdAt)}</td>
                    </tr>`;
                }).join('');
            }

            renderPagination('unknown-pagination', pagination, (p) => loadUnknown(p));

        } catch (e) {
            console.error('Unknown load error:', e);
        }
    }

    // ─── Analytics ───────────────────────────────────────

    async function loadAnalytics() {
        try {
            const data = await api('/overview');
            const t = data.totals;

            const avgVisits = data.users.total > 0 ? (t.visits / data.users.total).toFixed(1) : 0;
            const avgMessages = data.users.total > 0 ? (t.messages / data.users.total).toFixed(1) : 0;
            const conversionRate = data.users.total > 0 ? ((t.ctaEngagements / data.users.total) * 100).toFixed(1) : 0;

            $('#analytics-cards').innerHTML = `
                ${statCard('📊', avgVisits, 'متوسط الزيارات / مستخدم', 'primary')}
                ${statCard('💬', avgMessages, 'متوسط الرسائل / مستخدم', 'accent')}
                ${statCard('🎯', conversionRate + '%', 'نسبة التحويل', 'warning')}
                ${statCard('❓', data.unknownQuestions, 'أسئلة لم تُجاب', 'danger')}
            `;

            renderBar('chart-engagement', ['رسائل', 'زيارات', 'ألعاب', 'تحويلات'], [t.messages, t.visits, t.games, t.ctaEngagements], '#10B981');

        } catch (e) {
            console.error('Analytics load error:', e);
        }
    }

    // ─── Achievements ────────────────────────────────────

    async function loadAchievements() {
        try {
            const data = await api('/achievements');

            $('#achievement-cards').innerHTML = data.achievements.map(a => `
                <div class="achievement-admin-card">
                    <div class="ach-icon">${a.name.slice(-2)}</div>
                    <div class="ach-info">
                        <div class="ach-name">${a.name}</div>
                        <span class="ach-rarity ${a.rarity}">${rarityLabel(a.rarity)}</span>
                    </div>
                    <div style="text-align: center;">
                        <div class="ach-count">${a.unlockedBy}</div>
                        <div class="ach-count-label">فاتحين</div>
                    </div>
                </div>
            `).join('');

            const rd = data.rarityDistribution;
            renderDonut('chart-rarity', ['عادي', 'نادر', 'ملحمي', 'أسطوري'], [rd.common, rd.rare, rd.epic, rd.legendary], ['#788C9B', '#4285F4', '#9C55EC', '#E69500']);

            renderBar('chart-achievement-bars', data.achievements.map(a => a.name.replace(/[^\u0600-\u06FF\s]/g, '').trim()), data.achievements.map(a => a.unlockedBy), '#6366F1');

        } catch (e) {
            console.error('Achievements load error:', e);
        }
    }

    // ─── Games ───────────────────────────────────────────

    async function loadGames() {
        try {
            const data = await api('/games');
            const t = data.totals;

            const winRate = t.games > 0 ? ((t.wins / t.games) * 100).toFixed(1) : 0;

            $('#game-cards').innerHTML = `
                ${statCard('🎮', t.games, 'إجمالي الألعاب', 'primary')}
                ${statCard('🏆', t.wins, 'فوز المستخدمين', 'primary')}
                ${statCard('💀', t.losses, 'فوز فرزون', 'danger')}
                ${statCard('🤝', t.draws, 'تعادل', 'warning')}
                ${statCard('👥', t.playerCount, 'عدد اللاعبين', 'accent')}
                ${statCard('📈', winRate + '%', 'نسبة فوز المستخدمين', 'primary')}
            `;

            renderDonut('chart-game-results', ['فوز المستخدم', 'فوز فرزون', 'تعادل'], [t.wins, t.losses, t.draws], ['#10B981', '#EF4444', '#F59E0B']);

            // Top players table
            if (data.topPlayers.length === 0) {
                $('#top-players-tbody').innerHTML = '<tr><td colspan="6" class="loading-cell">مفيش لاعبين لسه 🎮</td></tr>';
            } else {
                $('#top-players-tbody').innerHTML = data.topPlayers.map((p, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${escHtml(p.name)}</td>
                        <td>${p.gamesPlayed}</td>
                        <td>${p.wins}</td>
                        <td>${p.losses}</td>
                        <td>${p.draws}</td>
                    </tr>
                `).join('');
            }

        } catch (e) {
            console.error('Games load error:', e);
        }
    }

    // ─── Users ───────────────────────────────────────────

    async function loadUsers(page) {
        try {
            const data = await api(`/users?page=${page}&limit=15`);
            const { users, pagination } = data;

            $('#users-total').textContent = pagination.total;

            if (users.length === 0) {
                $('#users-tbody').innerHTML = '<tr><td colspan="6" class="loading-cell">مفيش مستخدمين لسه</td></tr>';
            } else {
                $('#users-tbody').innerHTML = users.map(u => `
                    <tr>
                        <td><code style="font-size:0.78rem;color:var(--admin-text-secondary)">${escHtml(u.sessionId)}</code></td>
                        <td>${escHtml(u.name)}</td>
                        <td>${u.visitCount}</td>
                        <td>${u.messages}</td>
                        <td>${u.gamesPlayed}</td>
                        <td>${formatDate(u.lastSeen)}</td>
                    </tr>
                `).join('');
            }

            renderPagination('users-pagination', pagination, (p) => loadUsers(p));

        } catch (e) {
            console.error('Users load error:', e);
        }
    }

    // ─── UI Helpers ──────────────────────────────────────

    function statCard(icon, value, label, accent = '') {
        return `
            <div class="stat-card ${accent}">
                <div class="stat-icon">${icon}</div>
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
    }

    function escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) +
                ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        } catch { return '—'; }
    }

    function rarityLabel(r) {
        const map = { common: 'عادي', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' };
        return map[r] || r;
    }

    function renderPagination(containerId, pagination, onPageChange) {
        const container = $(`#${containerId}`);
        if (!container || pagination.totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button ${pagination.page <= 1 ? 'disabled' : ''} data-page="${pagination.page - 1}">السابق</button>`;
        html += `<span class="page-info">${pagination.page} / ${pagination.totalPages}</span>`;
        html += `<button ${pagination.page >= pagination.totalPages ? 'disabled' : ''} data-page="${pagination.page + 1}">التالي</button>`;

        container.innerHTML = html;
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.page);
                if (p >= 1 && p <= pagination.totalPages) onPageChange(p);
            });
        });
    }

    // ─── Chart Helpers ───────────────────────────────────

    function getChartColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            text: isDark ? '#E2E8F0' : '#1A1A2E',
            grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        };
    }

    function renderDonut(canvasId, labels, data, colors) {
        const ctx = $(`#${canvasId}`);
        if (!ctx) return;

        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

        const c = getChartColors();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: c.text, font: { family: 'Cairo', weight: '600', size: 12 }, padding: 16 }
                    }
                },
                cutout: '65%',
            }
        });
    }

    function renderBar(canvasId, labels, data, color) {
        const ctx = $(`#${canvasId}`);
        if (!ctx) return;

        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

        const c = getChartColors();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: color + '33',
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: c.grid },
                        ticks: { color: c.text, font: { family: 'Cairo', weight: '600' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: c.text, font: { family: 'Cairo', weight: '600', size: 11 } }
                    }
                }
            }
        });
    }

    function rebuildActiveCharts() {
        const activeTab = $('.tab.active')?.dataset.tab;
        if (activeTab) {
            loadedTabs.delete(activeTab);
            loadTab(activeTab, true);
        }
    }

    // ─── Init ────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        initAuth();
        initTheme();
        initTabs();
        initActions();
    });

})();
