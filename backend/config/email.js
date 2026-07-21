// Email configuration validator
// Validates Resend environment variables during server startup
// Fails fast if any required variable is missing

const REQUIRED_ENV_VARS = [
  "EMAIL_PROVIDER",
  "RESEND_API_KEY",
  "EMAIL_FROM",
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

  const fromEmail = process.env.EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  console.log("\n========================================");
  console.log("EMAIL SERVICE");
  console.log("========================================");
  console.log(`Provider : Resend`);
  console.log(`Transport: HTTP API`);
  console.log(`From      : ${fromEmail}`);
  console.log("");
  console.log(`✓ Resend client initialized`);

  return true;
}

export function getEmailConfig() {
  validateEmailConfig();

  return {
    fromEmail: process.env.EMAIL_FROM,
    resendApiKey: process.env.RESEND_API_KEY,
  };
}
