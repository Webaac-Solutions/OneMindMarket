const https = require("https");

const DEFAULT_API_VERSION = "v22.0";
const DEFAULT_PHONE_NUMBER_ID = "1193595493837770";
const DEFAULT_TEMPLATE_NAME = "enquiry_notification";

function normalizeWhatsAppNumber(phone) {
  if (!phone) return null;

  let number = String(phone).replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);

  // Existing customer records often contain a local 10-digit Indian number.
  // A country code is required by the WhatsApp Cloud API.
  if (number.length === 10 && process.env.WHATSAPP_DEFAULT_COUNTRY_CODE) {
    number = `${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE}${number}`;
  }

  return number.length >= 8 && number.length <= 15 ? number : null;
}

function postJson(url, payload, accessToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let responseBody = "";
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          let data = null;
          try {
            data = responseBody ? JSON.parse(responseBody) : null;
          } catch (_) {
            /* Keep raw response out of logs. */
          }

          if (response.statusCode >= 200 && response.statusCode < 300)
            return resolve(data);
          const error = new Error(
            data?.error?.message || "WhatsApp API request failed",
          );
          error.statusCode = response.statusCode;
          reject(error);
        });
      },
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function sendEnquiryNotification({ shop, enquiry }) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID || DEFAULT_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME;

  if (!accessToken) {
    return { sent: false, reason: "WhatsApp notification is not configured" };
  }

  const recipient = normalizeWhatsAppNumber(shop.ownerPhone);
  if (!recipient) {
    return {
      sent: false,
      reason: "The business owner has no valid WhatsApp number",
    };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";
  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: shop.shopName || "Your business" },
            { type: "text", text: enquiry.name || "Not provided" },
            { type: "text", text: enquiry.phone || "Not provided" },
            { type: "text", text: enquiry.enquiry || "Not provided" },
            { type: "text", text: enquiry.referredBy || "Not provided" },
          ],
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const result = await postJson(url, payload, accessToken);
  return { sent: true, messageId: result?.messages?.[0]?.id };
}

module.exports = { sendEnquiryNotification };
