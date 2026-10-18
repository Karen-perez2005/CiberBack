const bcrypt = require("bcryptjs");
const { execFileSync } = require("child_process");
const readline = require("readline");

const hash = execFileSync("sudo", [
  "-u", "postgres",
  "psql",
  "-d", "miappdb",
  "-Atc",
  "SELECT password_hash FROM usuarios WHERE usuario = 'karen.perez92@unach.mx'"
], { encoding: "utf8" }).trim();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Contraseña a verificar: ", async (password) => {
  const coincide = await bcrypt.compare(password, hash);
  console.log("Coincide:", coincide);
  rl.close();
});
