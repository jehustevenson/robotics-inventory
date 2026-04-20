// server/hash-password.js
// Run: node hash-password.js yourpassword
// Then paste the output hash into server/.env

const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node hash-password.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("\nYour bcrypt hash:\n");
  console.log(hash);
  console.log("\nPaste this into your server/.env USERS array as the password field.\n");
});