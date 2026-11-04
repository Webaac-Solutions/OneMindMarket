const https = require("https");

const SITE_URL = process.env.SITE_URL || "https://onemindmarket.in";

// Site paths like /articles become full URLs for the push click target
function toAbsoluteUrl(url) {
  if (!url) return SITE_URL;
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

// Send a web push to every subscriber through the OneSignal REST API
function sendPush({ title, message, url, image }) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey)
    return Promise.resolve({
      sent: false,
      reason: "OneSignal is not configured",
    });

  const body = JSON.stringify({
    app_id: appId,
    target_channel: "push",
    included_segments: [process.env.ONESIGNAL_SEGMENT || "Total Subscriptions"],
    headings: { en: title },
    contents: { en: message },
    web_url: toAbsoluteUrl(url),
    ...(image ? { chrome_web_image: image } : {}),
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => (raw += chunk));
        response.on("end", () => {
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch (_) {
            /* keep raw response out of logs */
          }
          const apiError = Array.isArray(data?.errors) ? data.errors[0] : null;
          if (
            response.statusCode >= 200 &&
            response.statusCode < 300 &&
            data?.id
          )
            return resolve({ sent: true, id: data.id });
          // e.g. "no subscribers yet" comes back as a 200 with errors
          resolve({
            sent: false,
            reason:
              (typeof apiError === "string" && apiError) ||
              "OneSignal could not send the notification",
          });
        });
      },
    );
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

let countCache = { value: null, at: 0 };

function getSubscriberCount() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) return Promise.resolve(null);
  if (Date.now() - countCache.at < 10000)
    return Promise.resolve(countCache.value);

  return new Promise((resolve) => {
    const request = https.request(
      `https://api.onesignal.com/apps/${appId}`,
      { method: "GET", headers: { Authorization: `Key ${apiKey}` } },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => (raw += chunk));
        response.on("end", () => {
          let count = null;
          try {
            const data = JSON.parse(raw);
            const n = data?.messageable_players ?? data?.players;
            if (response.statusCode === 200 && Number.isFinite(n)) count = n;
          } catch (_) {}
          countCache = { value: count, at: Date.now() };
          resolve(count);
        });
      },
    );
    request.on("error", () => resolve(null));
    request.setTimeout(8000, () => request.destroy());
    request.end();
  });
}

module.exports = { sendPush, getSubscriberCount };
