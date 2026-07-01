/**
 * One-time migration script: backfill reputationHistory for existing users.
 *
 * For any user whose reputationHistory is empty but whose reputationScore
 * differs from the default (100), a single synthetic "INITIAL_SCORE" entry
 * is inserted so the profile history panel is not blank.
 *
 * Usage:
 *   node backend/scripts/migrateReputationHistory.mjs
 *
 * Safe to re-run — it only touches users that still have an empty history.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const DEFAULT_SCORE = 100;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('[Migration] Connected to MongoDB.');

    // Find users with an empty reputationHistory array whose score is non-default.
    // Users at exactly the default score with no history have nothing useful to backfill.
    const users = await User.find({
      $or: [
        { reputationHistory: { $exists: false } },
        { reputationHistory: { $size: 0 } },
      ],
      reputationScore: { $ne: DEFAULT_SCORE },
    });

    console.log(`[Migration] Found ${users.length} user(s) to backfill.`);

    let updated = 0;
    for (const user of users) {
      const score = user.reputationScore ?? DEFAULT_SCORE;

      user.reputationHistory = [
        {
          action: 'INITIAL_SCORE',
          points: score - DEFAULT_SCORE, // delta from the baseline (negative if penalised, positive if boosted)
          createdAt: user.createdAt || new Date(),
        },
      ];

      await user.save();
      updated++;
      console.log(`  ✔ Backfilled user ${user._id} (${user.email}) — score: ${score}`);
    }

    console.log(`[Migration] Done. ${updated} user(s) updated.`);
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Fatal error:', err);
    process.exit(1);
  }
})();
