const bcrypt = require("bcrypt");

async function createAdmin() {
  const password = "mohini";
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

createAdmin();
