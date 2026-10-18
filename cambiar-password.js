const bcrypt = require("bcryptjs");
const { execFileSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Nueva contraseña: ", async (password) => {
  if (password.length < 12) {
    console.log("Utiliza al menos 12 caracteres.");
    rl.close();
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 12);

    const sql = `
      UPDATE usuarios
      SET password_hash = '${hash}'
      WHERE usuario = 'karen.perez92@unach.mx';
    `;

    const resultado = execFileSync("sudo", [
      "-u", "postgres",
      "psql", "-d", "miappdb",
      "-c", sql
    ], { encoding: "utf8" });

    console.log(resultado);
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error.message);
  }

  rl.close();
});
