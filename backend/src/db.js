import pg from 'pg';
import 'dotenv/config';

pg.types.setTypeParser(1082, (valor) => valor);
pg.types.setTypeParser(1114, (valor) => valor);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=America/Mexico_City',
});

export default pool;