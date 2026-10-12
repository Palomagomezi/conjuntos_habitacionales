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

CREATE TABLE IF NOT EXISTS cuotas (
  id SERIAL PRIMARY KEY,
  conjunto_id INTEGER NOT NULL REFERENCES conjuntos(id) ON DELETE CASCADE,
  unidad_id INTEGER NOT NULL REFERENCES unidades(id),
  concepto VARCHAR(150) NOT NULL,
  periodo VARCHAR(7) NOT NULL,
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha_limite DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'pagada')),
  creado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE (unidad_id, concepto, periodo)
);

CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  conjunto_id INTEGER NOT NULL REFERENCES conjuntos(id) ON DELETE CASCADE,
  cuota_id INTEGER NOT NULL UNIQUE REFERENCES cuotas(id),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo VARCHAR(20) NOT NULL
    CHECK (metodo IN ('efectivo', 'transferencia', 'deposito')),
  referencia VARCHAR(100),
  registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comprobantes (
  id SERIAL PRIMARY KEY,
  pago_id INTEGER NOT NULL UNIQUE REFERENCES pagos(id) ON DELETE CASCADE,
  folio VARCHAR(30) NOT NULL UNIQUE,
  emitido_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresos (
  id SERIAL PRIMARY KEY,
  conjunto_id INTEGER NOT NULL REFERENCES conjuntos(id) ON DELETE CASCADE,
  concepto VARCHAR(150) NOT NULL,
  categoria VARCHAR(30) NOT NULL
    CHECK (categoria IN ('mantenimiento', 'servicios', 'limpieza', 'seguridad', 'administracion', 'otro')),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha DATE NOT NULL,
  descripcion TEXT,
  registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);