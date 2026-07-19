import { SESv2Client } from "@aws-sdk/client-sesv2";
import { getEmailConfig } from "../../config/email.js";

let sesClientInstance = null;

export function getSESClient() {
  if (!sesClientInstance) {
    const config = getEmailConfig();

    sesClientInstance = new SESv2Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    console.log("✓ Singleton SESv2Client initialized");
  }

  return sesClientInstance;
}

export function resetSESClient() {
  sesClientInstance = null;
}