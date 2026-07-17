import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: ["varuncode7@gmail.com"],
    subject: "Resend Test",
    html: "<h1>Hello!</h1>",
  });
console.log(JSON.stringify(process.env.RESEND_API_KEY));
  console.log(result);
} catch (err) {
  console.error(err);
}