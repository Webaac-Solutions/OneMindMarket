const sanitizeHtml = require("sanitize-html");

const options = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "ol",
    "ul",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "img",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    "*": ["class"],
  },
  allowedClasses: { "*": ["ql-*"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

module.exports = (html) => sanitizeHtml(String(html || ""), options);
