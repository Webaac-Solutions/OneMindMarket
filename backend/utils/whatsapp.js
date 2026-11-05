const https = require("https");

const DEFAULT_API_VERSION = "v22.0";
// Legacy sender settings are retained for reference.
// Active values come from the backend process environment.
// const LEGACY_PHONE_NUMBER_ID = "1193595493837770";
// const LEGACY_TEMPLATE_NAME = "enquiry_notification";
const DEFAULT_PHONE_NUMBER_ID = "1290284064178412";
const DEFAULT_TEMPLATE_NAME = "new_business_enquiry";
const DEFAULT_TEMPLATE_LANGUAGE = "en";
const MAX_ENQUIRY_PARAMETER_LENGTH = 1000;

function normalizeWhatsAppNumber(phone) {
  if (!phone) return null;

  let number = String(phone).replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);

  if (number.length === 10) {
    const countryCode = String(
      process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91",
    ).replace(/\D/g, "");
    number = `${countryCode}${number}`;
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
          const error = new Error("Meta WhatsApp API request failed");
          error.statusCode = response.statusCode;
          error.metaCode =
            Number.isInteger(data?.error?.code) ? data.error.code : null;
          error.metaType =
            typeof data?.error?.type === "string" &&
            /^[A-Za-z]+$/.test(data.error.type)
              ? data.error.type
              : null;
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

  const ownerName = shop.ownerName?.trim();
  if (!ownerName) {
    return {
      sent: false,
      reason: "Business owner name is not available",
    };
  }

  const enquiryDetails = enquiry.enquiry?.trim();
  if (!enquiryDetails) {
    return {
      sent: false,
      reason: "Enquiry details are not available",
    };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION;
  const templateLanguage =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_TEMPLATE_LANGUAGE;
  const receivedAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(enquiry.createdAt || Date.now()));
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
            { type: "text", text: ownerName },
            { type: "text", text: shop.shopName },
            { type: "text", text: enquiry.name },
            { type: "text", text: enquiry.phone },
            {
              type: "text",
              text: enquiryDetails.slice(0, MAX_ENQUIRY_PARAMETER_LENGTH),
            },
            { type: "text", text: `${receivedAt} IST` },
          ],
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const result = await postJson(url, payload, accessToken);
  return { sent: true, messageId: result?.messages?.[0]?.id };
}

module.exports = {
  sendEnquiryNotification,
  MAX_ENQUIRY_PARAMETER_LENGTH,
};
