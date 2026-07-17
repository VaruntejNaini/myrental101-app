import dotenv from "dotenv";

dotenv.config();

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "onboarding@resend.dev",
    to: ["varuncode7@gmail.com"],
    subject: "Test",
    html: "<h1>Hello</h1>",
  }),
});

console.log("Status:", res.status);
console.log(await res.text());