-- ===================================================================
-- SCRIPT DDL: ControlMax -> TryController (Migração Hierárquica)
-- Banco de Dados: PostgreSQL
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. TIPOS CUSTOMIZADOS (ENUMS)
-- -------------------------------------------------------------------
CREATE TYPE estado_caja AS ENUM ('Sin Caja', 'Abierta', 'Cerrada', 'Confirmada');
CREATE TYPE tipo_unidad AS ENUM ('Estática', 'Móvil');
CREATE TYPE tipo_movimiento AS ENUM ('Ingreso', 'Egreso', 'Gasto', 'Venta');

-- -------------------------------------------------------------------
-- 2. HIERARQUIA ORGANIZACIONAL
-- -------------------------------------------------------------------

-- Tabela: sociedades
CREATE TABLE sociedades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: centros_negocio
CREATE TABLE centros_negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sociedade_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    configuracion_financiera JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_centro_sociedade FOREIGN KEY (sociedade_id) REFERENCES sociedades(id) ON DELETE CASCADE
);

-- Tabela: unidades
CREATE TABLE unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_negocio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    tipo tipo_unidad NOT NULL,
    sincronizada_at TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_unidad_centro FOREIGN KEY (centro_negocio_id) REFERENCES centros_negocio(id) ON DELETE CASCADE
);


-- -------------------------------------------------------------------
-- 3. CONTROLE DE ACESSO (RBAC)
-- Nota: Criamos antes de "cajas" para referenciar responsable_usuario_id
-- -------------------------------------------------------------------

-- Tabela: perfiles
CREATE TABLE perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    permisos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_display VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_perfil FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE RESTRICT
);

-- Tabela Pivô: usuario_unidades
CREATE TABLE usuario_unidades (
    usuario_id UUID NOT NULL,
    unidad_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, unidad_id),
    CONSTRAINT fk_pivo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_pivo_unidad FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE
);


-- -------------------------------------------------------------------
-- 4. GESTÃO DE CAIXA E ESTADOS (Máquina de Estados)
-- -------------------------------------------------------------------

-- Tabela: cajas
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidad_id UUID NOT NULL,
    fecha_caja DATE NOT NULL,
    estado estado_caja NOT NULL DEFAULT 'Sin Caja',
    saldo_inicial BIGINT NOT NULL DEFAULT 0, -- Em centavos para evitar flutuação
    saldo_final BIGINT NOT NULL DEFAULT 0,   -- Em centavos para evitar flutuação
    responsable_usuario_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_caja_unidad FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE RESTRICT,
    CONSTRAINT fk_caja_usuario FOREIGN KEY (responsable_usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT uq_unidad_fecha UNIQUE (unidad_id, fecha_caja) -- Evita caixas duplicados no mesmo dia
);

-- Trigger para atualizar updated_at automaticamente na tabela cajas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_cajas_updated_at
BEFORE UPDATE ON cajas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela: movimientos
CREATE TABLE movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL,
    tipo tipo_movimiento NOT NULL,
    monto BIGINT NOT NULL, -- Valores em centavos!
    origen_destino VARCHAR(255),
    comprobante_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_caja FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE,
    CONSTRAINT chk_monto_positivo CHECK (monto >= 0) -- Garante que valores de movimento não sejam negativos, a lógica de soma/subtração deve ser pela aplicação usando 'tipo'
);

