const secret = process.env.JWT_SECRET;

if (!secret || secret === "change_this_secret") {
  console.error("JWT_SECRET is missing or insecure. Set a strong JWT_SECRET in the environment.");
  process.exit(1);
}

module.exports = secret;
