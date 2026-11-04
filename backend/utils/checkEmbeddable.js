const http = require("http");
const https = require("https");

const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

function fetchHeaders(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve) => {
    let target;
    try {
      target = new URL(url);
    } catch {
      return resolve(null);
    }
    const client = target.protocol === "http:" ? http : https;
    const req = client.request(
      target,
      {
        method: "GET",
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html",
        },
      },
      (res) => {
        const { statusCode, headers } = res;
        res.destroy();
        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          if (redirectsLeft <= 0) return resolve(null);
          try {
            const next = new URL(headers.location, target).toString();
            return resolve(fetchHeaders(next, redirectsLeft - 1));
          } catch {
            return resolve(null);
          }
        }
        if (statusCode >= 400) return resolve(null);
        resolve(headers);
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

async function isEmbeddable(url) {
  if (!url) return false;
  const headers = await fetchHeaders(url);
  if (!headers) return false;
  if (headers["x-frame-options"]) return false;
  const csp = headers["content-security-policy"];
  if (csp) {
    const match = String(csp).match(/frame-ancestors([^;]*)/i);
    if (match && !match[1].trim().split(/\s+/).includes("*")) return false;
  }
  return true;
}

module.exports = { isEmbeddable };
