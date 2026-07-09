import User from "../models/User.js";

/**
 * Awards reputation points to a user and logs the transaction in the user's reputation history.
 * Protects the reputation floor from falling below 0.
 *
 * @param {string} userId - The MongoDB User ID
 * @param {number} points - The points to award (can be positive or negative)
 * @param {string} reason - The reason code for the reputation modification
 * @param {object} [options] - Optional parameters
 * @param {object} [options.session] - Mongoose session for transaction participation
 */
export async function awardReputation(userId, points, reason, options = {}) {
  const { session } = options;
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      console.warn(`User with ID ${userId} not found for reputation update.`);
      return null;
    }

    const currentScore = user.reputationScore !== undefined ? user.reputationScore : 100;
    const newScore = Math.max(0, currentScore + points);

    user.reputationScore = newScore;

    if (!user.reputationHistory) {
      user.reputationHistory = [];
    }

    user.reputationHistory.push({
      action: reason,
      points: points,
      createdAt: new Date()
    });

    await user.save({ session });
    console.log(`[Reputation] User ${userId} modified by ${points} points. Reason: ${reason}. New Score: ${newScore}`);
    return user;
  } catch (err) {
    console.error("Error in awardReputation service:", err);
    throw err;
  }
}
