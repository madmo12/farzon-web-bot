/**
 * ADMIN CONTROLLER — Dashboard API endpoints
 * 
 * Optimized MongoDB queries for admin dashboard.
 * All endpoints are protected by adminAuth middleware.
 */

const User = require('../models/User');
const UnknownQuestion = require('../models/UnknownQuestion');

// ─── Achievement thresholds (mirror frontend definitions) ────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_visit',  name: 'أول زيارة 👋',         rarity: 'common',    field: 'visitCount', min: 1 },
  { id: 'farzawi_new',  name: 'فرزاوي جديد 😏',       rarity: 'common',    field: 'stats.messages', min: 5 },
  { id: 'curious',      name: 'فضولي زيادة 👀',       rarity: 'rare',      field: 'stats.messages', min: 15 },
  { id: 'xo_player',    name: 'لاعب X/O 🎮',          rarity: 'rare',      field: 'stats.gamesPlayed', min: 1 },
  { id: 'silver',       name: 'فرزاوي فضي 🥈',        rarity: 'epic',      field: 'visitCount', min: 3 },
  { id: 'legendary',    name: 'فرزاوي أسطوري 🔥',     rarity: 'legendary', multi: true },
];

/**
 * GET /api/admin/overview
 * Aggregate dashboard summary stats.
 */
const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel
    const [
      totalUsers,
      activeLast24h,
      newLast7d,
      totals,
      totalUnknown
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: last24h } }),
      User.countDocuments({ firstSeen: { $gte: last7d } }),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalVisits: { $sum: '$visitCount' },
            totalMessages: { $sum: '$stats.messages' },
            totalGames: { $sum: '$stats.gamesPlayed' },
            totalWins: { $sum: '$stats.wins' },
            totalLosses: { $sum: '$stats.losses' },
            totalDraws: { $sum: '$stats.draws' },
            totalCTA: { $sum: '$ctaEngagements' },
          }
        }
      ]),
      UnknownQuestion.countDocuments()
    ]);

    const t = totals[0] || {};

    return res.json({
      users: {
        total: totalUsers,
        activeLast24h,
        newLast7d,
      },
      totals: {
        visits: t.totalVisits || 0,
        messages: t.totalMessages || 0,
        games: t.totalGames || 0,
        wins: t.totalWins || 0,
        losses: t.totalLosses || 0,
        draws: t.totalDraws || 0,
        ctaEngagements: t.totalCTA || 0,
      },
      unknownQuestions: totalUnknown,
    });

  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/users?page=1&limit=20&sort=lastSeen
 * Paginated user list.
 */
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const sortField = req.query.sort || 'lastSeen';
    const sortDir = req.query.dir === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    // Sanitize: return only needed fields
    const sanitized = users.map(u => ({
      sessionId: u.sessionId?.substring(0, 8) + '...',
      name: u.name || '—',
      visitCount: u.visitCount || 0,
      messages: u.stats?.messages || 0,
      gamesPlayed: u.stats?.gamesPlayed || 0,
      wins: u.stats?.wins || 0,
      losses: u.stats?.losses || 0,
      draws: u.stats?.draws || 0,
      lastTopic: u.lastTopic || '—',
      ctaEngagements: u.ctaEngagements || 0,
      firstSeen: u.firstSeen,
      lastSeen: u.lastSeen,
    }));

    return res.json({
      users: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/unknown?page=1&limit=20
 * Paginated unknown/fallback questions, sorted by frequency.
 */
const getUnknown = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      UnknownQuestion.find()
        .sort({ count: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UnknownQuestion.countDocuments()
    ]);

    return res.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Admin unknown error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/achievements
 * Achievement analytics: how many users qualify for each achievement.
 */
const getAchievements = async (req, res) => {
  try {
    // Count eligible users for each achievement
    const counts = await Promise.all(
      ACHIEVEMENT_DEFS.map(async (def) => {
        let count;
        if (def.multi) {
          // Legendary: messages >= 50 AND visits >= 5
          count = await User.countDocuments({
            'stats.messages': { $gte: 50 },
            visitCount: { $gte: 5 }
          });
        } else {
          count = await User.countDocuments({
            [def.field]: { $gte: def.min }
          });
        }
        return {
          id: def.id,
          name: def.name,
          rarity: def.rarity,
          unlockedBy: count,
        };
      })
    );

    // Rarity distribution
    const rarityDist = { common: 0, rare: 0, epic: 0, legendary: 0 };
    counts.forEach(a => { rarityDist[a.rarity] = (rarityDist[a.rarity] || 0) + a.unlockedBy; });

    return res.json({
      achievements: counts,
      rarityDistribution: rarityDist,
    });

  } catch (error) {
    console.error('Admin achievements error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/games
 * Game analytics: aggregate stats + top players.
 */
const getGames = async (req, res) => {
  try {
    const [totals, topPlayers] = await Promise.all([
      User.aggregate([
        { $match: { 'stats.gamesPlayed': { $gte: 1 } } },
        {
          $group: {
            _id: null,
            totalGames: { $sum: '$stats.gamesPlayed' },
            totalWins: { $sum: '$stats.wins' },
            totalLosses: { $sum: '$stats.losses' },
            totalDraws: { $sum: '$stats.draws' },
            playerCount: { $sum: 1 },
          }
        }
      ]),
      User.find({ 'stats.gamesPlayed': { $gte: 1 } })
        .sort({ 'stats.gamesPlayed': -1 })
        .limit(10)
        .lean()
    ]);

    const t = totals[0] || {};

    const players = topPlayers.map(u => ({
      sessionId: u.sessionId?.substring(0, 8) + '...',
      name: u.name || '—',
      gamesPlayed: u.stats?.gamesPlayed || 0,
      wins: u.stats?.wins || 0,
      losses: u.stats?.losses || 0,
      draws: u.stats?.draws || 0,
    }));

    return res.json({
      totals: {
        games: t.totalGames || 0,
        wins: t.totalWins || 0,
        losses: t.totalLosses || 0,
        draws: t.totalDraws || 0,
        playerCount: t.playerCount || 0,
      },
      topPlayers: players,
    });

  } catch (error) {
    console.error('Admin games error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getOverview, getUsers, getUnknown, getAchievements, getGames };
