import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ruta = path.join(__dirname, '../../database/schema.sql');

try {
  const sql = fs.readFileSync(ruta, 'utf8');
  await pool.query(sql);
  console.log('Tablas creadas correctamente');
} catch (error) {
  console.error('Error al crear las tablas:', error.message);
} finally {
  await pool.end();
}