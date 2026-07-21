// Email configuration validator
// Validates SMTP environment variables during server startup
// Fails fast if any required variable is missing

const REQUIRED_ENV_VARS = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_SECURE",
  "EMAIL_USER",
  "EMAIL_PASS",
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

  const provider = process.env.EMAIL_PROVIDER || "nodemailer";

  console.log("\n=================================");
  console.log("EMAIL CONFIGURATION");
  console.log("=================================");
  console.log(`Provider : ${provider}`);
  console.log(`Transport: SMTP`);
  console.log(`Host      : ${process.env.EMAIL_HOST}`);
  console.log(`Port      : ${process.env.EMAIL_PORT}`);
  console.log(`Secure    : ${process.env.EMAIL_SECURE === "true"}`);
  console.log(`From      : ${process.env.EMAIL_FROM}`);
  console.log("=================================\n");

  return true;
}

export function getEmailConfig() {
  validateEmailConfig();

  return {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  };
}
