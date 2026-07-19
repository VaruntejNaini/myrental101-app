import { getSESClient } from "./sesClient.js";

export async function checkEmailHealth() {
  const checks = {
    clientInitialized: false,
    credentialsLoaded: false,
    configurationExists: false,
    sesAccessible: false,
  };

  try {
    const client = getSESClient();
    checks.clientInitialized = !!client;

    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    const hasRegion = !!process.env.AWS_REGION;
    const hasFromEmail = !!process.env.AWS_SES_FROM;

    checks.credentialsLoaded = hasAccessKey && hasSecretKey;
    checks.configurationExists = hasRegion && hasFromEmail;

    const { ListEmailIdentitiesCommand } = await import("@aws-sdk/client-sesv2");
    const command = new ListEmailIdentitiesCommand({});
    
    await client.send(command);
    checks.sesAccessible = true;

    return {
      healthy: checks.clientInitialized && checks.credentialsLoaded && checks.configurationExists && checks.sesAccessible,
      checks,
      message: checks.sesAccessible ? "AWS SES is accessible" : "AWS SES is not accessible",
    };
  } catch (error) {
    return {
      healthy: false,
      checks,
      error: {
        name: error.name,
        message: error.message,
      },
    };
  }
}