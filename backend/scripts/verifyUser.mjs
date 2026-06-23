import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email = 'testprod@example.com';

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('USER_NOT_FOUND');
      process.exit(1);
    }
    user.isEmailVerified = true;
    await user.save();
    console.log('USER_VERIFIED');
    process.exit(0);
  } catch (e) {
    console.error('ERROR_VERIFYING_USER', e);
    process.exit(2);
  }
})();