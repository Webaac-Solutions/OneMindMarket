const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const https = require("node:https");
const test = require("node:test");
const {
  sendEnquiryNotification,
  MAX_ENQUIRY_PARAMETER_LENGTH,
} = require("../utils/whatsapp");

const ENV_KEYS = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_TEMPLATE_NAME",
  "WHATSAPP_TEMPLATE_LANGUAGE",
  "WHATSAPP_API_VERSION",
  "WHATSAPP_DEFAULT_COUNTRY_CODE",
];
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const originalRequest = https.request;

function configureEnv() {
  process.env.WHATSAPP_ACCESS_TOKEN = "test-token-not-for-logging";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "1290284064178412";
  process.env.WHATSAPP_TEMPLATE_NAME = "new_business_enquiry";
  process.env.WHATSAPP_TEMPLATE_LANGUAGE = "en";
  process.env.WHATSAPP_API_VERSION = "v22.0";
  process.env.WHATSAPP_DEFAULT_COUNTRY_CODE = "91";
}

function mockRequest(statusCode, responseData) {
  const requests = [];
  https.request = (url, options, callback) => {
    let requestBody = "";
    const request = new EventEmitter();
    request.write = (chunk) => {
      requestBody += chunk;
    };
    request.end = () => {
      requests.push({
        url: String(url),
        headers: options.headers,
        body: JSON.parse(requestBody),
      });
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = statusCode;
        callback(response);
        response.emit("data", Buffer.from(JSON.stringify(responseData)));
        response.emit("end");
      });
    };
    return request;
  };
  return requests;
}

test.beforeEach(configureEnv);

test.afterEach(() => {
  https.request = originalRequest;
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("sends the six positional values to the configured template endpoint", async () => {
  const requests = mockRequest(200, {
    messages: [{ id: "wamid.mock-message-id" }],
  });
  const result = await sendEnquiryNotification({
    shop: {
      ownerName: "Business Owner",
      ownerPhone: "9500027522",
      shopName: "Example Business",
    },
    enquiry: {
      name: "Customer Name",
      phone: "9500000000",
      enquiry: "Please contact me.",
      createdAt: "2026-02-01T04:05:00.000Z",
    },
  });

  assert.deepEqual(result, { sent: true, messageId: "wamid.mock-message-id" });
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    "https://graph.facebook.com/v22.0/1290284064178412/messages",
  );
  assert.equal(
    requests[0].headers.Authorization,
    "Bearer test-token-not-for-logging",
  );
  assert.equal(requests[0].body.to, "919500027522");
  assert.equal(requests[0].body.template.name, "new_business_enquiry");
  assert.deepEqual(requests[0].body.template.language, { code: "en" });

  const parameters = requests[0].body.template.components[0].parameters;
  assert.equal(requests[0].body.template.components[0].type, "body");
  assert.equal(parameters.length, 6);
  assert.deepEqual(
    parameters.slice(0, 5).map((parameter) => parameter.text),
    [
      "Business Owner",
      "Example Business",
      "Customer Name",
      "9500000000",
      "Please contact me.",
    ],
  );
  assert.match(parameters[5].text, /1 Feb 2026/);
  assert.match(parameters[5].text, /IST$/);
});

test("truncates long enquiry body text at the application's 1000-character limit", async () => {
  const requests = mockRequest(200, { messages: [{ id: "wamid.test" }] });
  const longEnquiry = "x".repeat(MAX_ENQUIRY_PARAMETER_LENGTH + 100);

  await sendEnquiryNotification({
    shop: {
      ownerName: "Business Owner",
      ownerPhone: "9500027522",
      shopName: "Example Business",
    },
    enquiry: {
      name: "Customer Name",
      phone: "9500000000",
      enquiry: longEnquiry,
      createdAt: "2026-02-01T04:05:00.000Z",
    },
  });

  const parameters = requests[0].body.template.components[0].parameters;
  assert.equal(parameters[4].text.length, MAX_ENQUIRY_PARAMETER_LENGTH);
});

test("does not send when owner name or enquiry details are unavailable", async () => {
  const requests = mockRequest(200, { messages: [{ id: "wamid.unused" }] });
  const base = {
    shop: {
      ownerPhone: "9500027522",
      shopName: "Example Business",
    },
    enquiry: {
      name: "Customer Name",
      phone: "9500000000",
      enquiry: "Please contact me.",
      createdAt: "2026-02-01T04:05:00.000Z",
    },
  };

  assert.equal(
    (await sendEnquiryNotification(base)).reason,
    "Business owner name is not available",
  );
  assert.equal(
    (
      await sendEnquiryNotification({
        ...base,
        shop: { ...base.shop, ownerName: "Business Owner" },
        enquiry: { ...base.enquiry, enquiry: "  " },
      })
    ).reason,
    "Enquiry details are not available",
  );
  assert.equal(requests.length, 0);
});

test("returns only safe Meta error metadata when the API rejects a request", async () => {
  mockRequest(404, {
    error: {
      message: "Template translation unavailable",
      type: "OAuthException",
      code: 132001,
    },
  });

  await assert.rejects(
    sendEnquiryNotification({
      shop: {
        ownerName: "Business Owner",
        ownerPhone: "9500027522",
        shopName: "Example Business",
      },
      enquiry: {
        name: "Customer Name",
        phone: "9500000000",
        enquiry: "Please contact me.",
        createdAt: "2026-02-01T04:05:00.000Z",
      },
    }),
    (error) => {
      assert.equal(error.statusCode, 404);
      assert.equal(error.metaCode, 132001);
      assert.equal(error.metaType, "OAuthException");
      assert.equal(error.message, "Meta WhatsApp API request failed");
      assert.equal(
        JSON.stringify(error).includes("test-token-not-for-logging"),
        false,
      );
      return true;
    },
  );
});
