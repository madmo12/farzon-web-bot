/**
 * STATS CONTROLLER — Progression Persistence
 * 
 * Lightweight endpoints for:
 *   - Fetching user stats (GET)
 *   - Tracking game events (POST)
 * 
 * Message counting is handled by chatController (piggybacked on /api/ask).
 * Visit counting is handled by the existing User.visitCount logic.
 */

const User = require('../models/User');

/**
 * GET /api/stats/:sessionId
 * Returns lightweight progression stats for the given session.
 */
const getStats = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || sessionId === 'undefined') {
      return res.json({
        visits: 0, messages: 0, gamesPlayed: 0,
        wins: 0, losses: 0, draws: 0
      });
    }

    const user = await User.findOne({ sessionId }).lean();

    if (!user) {
      return res.json({
        visits: 0, messages: 0, gamesPlayed: 0,
        wins: 0, losses: 0, draws: 0
      });
    }

    return res.json({
      visits: user.visitCount || 0,
      messages: user.stats?.messages || 0,
      gamesPlayed: user.stats?.gamesPlayed || 0,
      wins: user.stats?.wins || 0,
      losses: user.stats?.losses || 0,
      draws: user.stats?.draws || 0,
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return res.json({
      visits: 0, messages: 0, gamesPlayed: 0,
      wins: 0, losses: 0, draws: 0
    });
  }
};

/**
 * POST /api/stats/track
 * Atomically increments game stats.
 * Body: { sessionId, event: 'game_win' | 'game_loss' | 'game_draw' }
 */
const trackEvent = async (req, res) => {
  try {
    const { sessionId, event } = req.body;

    if (!sessionId || !event) {
      return res.status(400).json({ ok: false, error: 'Missing sessionId or event' });
    }

    const validEvents = ['game_win', 'game_loss', 'game_draw'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ ok: false, error: 'Invalid event type' });
    }

    // Build atomic $inc update — single DB write
    const inc = { 'stats.gamesPlayed': 1 };
    if (event === 'game_win')  inc['stats.wins'] = 1;
    if (event === 'game_loss') inc['stats.losses'] = 1;
    if (event === 'game_draw') inc['stats.draws'] = 1;

    await User.findOneAndUpdate(
      { sessionId },
      { $inc: inc },
      { upsert: true, new: true }
    );

    return res.json({ ok: true });

  } catch (error) {
    console.error('Stats track error:', error);
    return res.json({ ok: false });
  }
};

module.exports = { getStats, trackEvent };
