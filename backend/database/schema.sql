CREATE TABLE IF NOT EXISTS conjuntos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  conjunto_id INTEGER NOT NULL REFERENCES conjuntos(id) ON DELETE CASCADE,
  torre VARCHAR(50) NOT NULL DEFAULT '',
  numero VARCHAR(20) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('casa', 'departamento')),
  creado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE (conjunto_id, torre, numero)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  conjunto_id INTEGER NOT NULL REFERENCES conjuntos(id) ON DELETE CASCADE,
  unidad_id INTEGER REFERENCES unidades(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'residente')),
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);