require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'adminapi',
    host: 'localhost',
    database: 'miappdb',
    password: 'password123',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error("Falta configurar JWT_SECRET");
}

app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ mensaje: "Bienvenido a mi API REST principal con Base de Datos" });
});

// Ruta pública de prueba
app.get('/api', (req, res) => {
    res.json({ mensaje: "¡Hola! Tu API REST en Node.js está funcionando correctamente." });
});

// Ruta de Login conectada a PostgreSQL
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        if (resultado.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuarioDB = resultado.rows[0];
        const passwordValida = await bcrypt.compare(password, usuarioDB.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: usuarioDB.id, usuario: usuarioDB.usuario }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );
        res.json({ mensaje: 'Login exitoso', token });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
});

// Middleware de autenticación
const verificarToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        jwt.verify(bearerToken, SECRET_KEY, (err, authData) => {
            if (err) return res.status(403).json({ mensaje: 'Token inválido o expirado' });
            req.usuario = authData;
            next();
        });
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado' });
    }
};

// Ruta de Dashboard protegida que consulta la base de datos
app.get('/api/dashboard', verificarToken, async (req, res) => {
    try {
        const stats = await pool.query('SELECT titulo, valor FROM dashboard_stats WHERE usuario_id = $1', [req.usuario.id]);
        res.json({
            mensaje: 'Bienvenido al Dashboard',
            usuario: req.usuario.usuario,
            metricas: stats.rows
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener datos' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
