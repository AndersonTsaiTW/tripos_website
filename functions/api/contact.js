const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createEmailContent = ({ name, email, restaurant, message }) => {
  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Restaurant: ${restaurant || "Not provided"}`,
    "",
    "Message:",
    message,
  ].join("\r\n");
  const htmlBody = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Restaurant:</strong> ${escapeHtml(restaurant || "Not provided")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `.trim();
  return { htmlBody, textBody };
};

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: "Resend is not configured." }, 500);
  }

  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const restaurant = String(formData.get("restaurant") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    return json({ error: "Name, email, and message are required." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const fromAddress = env.CONTACT_FROM || "TriPOS <hello@tripos.ca>";
  const toAddress = env.CONTACT_TO || "triposcanada@gmail.com";
  const { htmlBody, textBody } = createEmailContent({ name, email, restaurant, message });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: email,
      subject: "TriPOS POS inquiry",
      html: htmlBody,
      text: textBody,
    }),
  });

  if (!response.ok) {
    return json({ error: "Email could not be sent." }, 502);
  }

  return json({ ok: true });
}
