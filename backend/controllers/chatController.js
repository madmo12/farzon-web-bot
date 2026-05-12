const UnknownQuestion = require('../models/UnknownQuestion');
const User = require('../models/User');
const { getBotReply } = require('../bot/logic');

const askQuestion = async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ reply: 'حصل مشكلة بسيطة 😅 جرّب تاني', topic: 'start' });
    }

    // Pre-fetch lightweight user metadata for memory restoration and personalization
    let dbUser = await User.findOne({ sessionId }).lean();

    // Call the newly migrated bot logic, passing the dbUser
    const botResponse = getBotReply(message, sessionId, dbUser);

    // Return the generated reply and the tracked topic immediately (NON-BLOCKING)
    res.json({
      reply: botResponse.reply,
      topic: botResponse.topic
    });

    // BACKGROUND: Fallback logic to save unknown questions & Analytics
    setImmediate(async () => {
      try {
        // 1. Update User memory and analytics
        let userDoc = await User.findOne({ sessionId });
        const now = new Date();
        
        if (!userDoc) {
          userDoc = new User({ sessionId, firstSeen: now, lastSeen: now, visitCount: 1 });
        } else {
          // If returning after >12 hours, count it as a new visit
          if (now - userDoc.lastSeen > 12 * 60 * 60 * 1000) {
            userDoc.visitCount += 1;
          }
          userDoc.lastSeen = now;
        }

        if (botResponse.extractedName && !userDoc.name) {
          userDoc.name = botResponse.extractedName;
        }

        userDoc.lastTopic = botResponse.topic || userDoc.lastTopic;

        // Track topics discussed
        if (botResponse.topic) {
          const currentCount = userDoc.topicsDiscussed.get(botResponse.topic) || 0;
          userDoc.topicsDiscussed.set(botResponse.topic, currentCount + 1);
        }

        // Track CTA/conversion (Assuming 'conversion_success' is a topic state we reach)
        if (botResponse.topic === 'conversion_success') {
          userDoc.ctaEngagements += 1;
        }

        // Increment progression message count (piggybacked, no extra DB call)
        if (!userDoc.stats) userDoc.stats = {};
        userDoc.stats.messages = (userDoc.stats.messages || 0) + 1;

        await userDoc.save();

        // 2. Log Unknown Questions
        if (botResponse.intentType === 'FALLBACK' || botResponse.intentType === 'UNKNOWN_TOPIC') {
          const normalizedMessage = message.toLowerCase().trim();
          let unknownQ = await UnknownQuestion.findOne({ question: normalizedMessage });
          
          if (unknownQ) {
            unknownQ.count += 1;
            await unknownQ.save();
          } else {
            await UnknownQuestion.create({
              question: normalizedMessage,
              count: 1,
              createdAt: now
            });
          }
        }
      } catch (err) {
        console.error("Background memory/analytics error:", err);
      }
    });

  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(500).json({ reply: 'حصل مشكلة بسيطة 😅 جرّب تاني', topic: 'start' });
  }
};

module.exports = {
  askQuestion
};
