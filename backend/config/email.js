// Email configuration validator
// Validates AWS SES environment variables during server startup
// Fails fast if any required variable is missing

const REQUIRED_ENV_VARS = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_SES_FROM",
];

export function validateEmailConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key].trim() === "");

  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:");
    missing.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.error("\nEmail service cannot start without these variables.");
    console.error("Please set them in your .env file and restart the server.\n");
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  console.log("✓ AWS SES configuration loaded successfully");
  return true;
}

export function getEmailConfig() {
  validateEmailConfig();

  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    fromEmail: process.env.AWS_SES_FROM,
  };
}