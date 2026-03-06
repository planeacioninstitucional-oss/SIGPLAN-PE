-- =============================================
-- SIGPLAN-PE: REESTRUCTURA COMPLETA DE BD
-- Ejecutar en: Supabase Studio > SQL Editor
-- URL: https://supabase.com/dashboard/project/nmklffdgsybkuxdegzak/sql/new
-- =============================================

-- ─────────────────────────────────────────────
-- PASO 1: GRUPOS DE PROCESO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grupos_proceso (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     text NOT NULL UNIQUE,
    orden      int  NOT NULL,
    color      text NOT NULL DEFAULT '#64748b',
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PASO 2: OFICINAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oficinas (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      text NOT NULL UNIQUE,
    abreviatura text,
    activa      boolean NOT NULL DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PASO 3: PROCESOS INSTITUCIONALES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.procesos_institucionales (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     text NOT NULL,
    grupo_id   uuid NOT NULL REFERENCES public.grupos_proceso(id) ON DELETE RESTRICT,
    oficina_id uuid NOT NULL REFERENCES public.oficinas(id)       ON DELETE RESTRICT,
    activo     boolean NOT NULL DEFAULT true,
    orden      int     NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PASO 4: PERFILES (actualiza o crea)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           text NOT NULL,
    nombre_completo text,
    cargo           text,
    rol             text NOT NULL DEFAULT 'funcionario'
                    CHECK (rol IN ('super_admin','jefe_oficina','equipo_planeacion','gerente','auditor','funcionario')),
    oficina_id      uuid REFERENCES public.oficinas(id),
    activo          boolean NOT NULL DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Si la tabla perfiles ya existía, agregar columnas nuevas sin error
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS cargo      text;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS oficina_id uuid REFERENCES public.oficinas(id);

-- ─────────────────────────────────────────────
-- PASO 5: DATOS REALES — GRUPOS
-- ─────────────────────────────────────────────
INSERT INTO public.grupos_proceso (nombre, orden, color) VALUES
    ('Procesos Estratégicos',  1, '#3b82f6'),
    ('Procesos Misionales',    2, '#8b5cf6'),
    ('Procesos de Apoyo',      3, '#10b981'),
    ('Procesos de Evaluación', 4, '#f59e0b')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────
-- PASO 6: DATOS REALES — OFICINAS
-- ─────────────────────────────────────────────
INSERT INTO public.oficinas (nombre, abreviatura) VALUES
    ('Oficina Asesora Planeación Institucional',                             'OAPI'),
    ('Gerencia General',                                                      'GG'),
    ('Oficina de Comunicación y Participación Ciudadana',                    'OCPC'),
    ('Oficina Asesora de Gestión Tecnológica y Transformación Digital',      'OGTTD'),
    ('Dirección Operativa y Comercial',                                      'DOC'),
    ('Dirección de Proyectos y Servicios Financieros',                       'DPSF'),
    ('Secretaría General',                                                    'SG'),
    ('Dirección de Servicios Administrativos',                               'DSA'),
    ('Oficina de Control Disciplinario',                                     'OCD'),
    ('Dirección Financiera',                                                  'DF'),
    ('Oficina de Control Interno',                                            'OCI')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────
-- PASO 7: DATOS REALES — 27 PROCESOS
-- ─────────────────────────────────────────────
INSERT INTO public.procesos_institucionales (nombre, grupo_id, oficina_id, orden)
SELECT nombre, g.id, o.id, orden FROM (VALUES
    -- ESTRATÉGICOS
    ('Gestión estratégica',                              'Procesos Estratégicos',  'Oficina Asesora Planeación Institucional',                           1),
    ('Gestión integral de riesgos',                      'Procesos Estratégicos',  'Gerencia General',                                                   2),
    ('Gestión del conocimiento y la innovación',         'Procesos Estratégicos',  'Oficina Asesora Planeación Institucional',                           3),
    ('Gestión de comunicación y participación ciudadana','Procesos Estratégicos',  'Oficina de Comunicación y Participación Ciudadana',                  4),
    ('Gestión tecnológica',                              'Procesos Estratégicos',  'Oficina Asesora de Gestión Tecnológica y Transformación Digital',    5),
    ('Gestión del Sistema Integrado de Gestión',         'Procesos Estratégicos',  'Oficina Asesora Planeación Institucional',                           6),
    -- MISIONALES
    ('Atención al ciudadano',                            'Procesos Misionales',    'Oficina de Comunicación y Participación Ciudadana',                  1),
    ('Gestión comercial',                                'Procesos Misionales',    'Dirección Operativa y Comercial',                                    2),
    ('Gestión de proyectos de promoción y desarrollo',   'Procesos Misionales',    'Dirección de Proyectos y Servicios Financieros',                     3),
    ('Operación esquemas empresariales',                 'Procesos Misionales',    'Dirección Operativa y Comercial',                                    4),
    ('Alumbrado público',                                'Procesos Misionales',    'Dirección Operativa y Comercial',                                    5),
    ('Plazas de mercado',                                'Procesos Misionales',    'Dirección Operativa y Comercial',                                    6),
    ('Parques y zonas verdes',                           'Procesos Misionales',    'Dirección Operativa y Comercial',                                    7),
    ('Relleno sanitario',                                'Procesos Misionales',    'Dirección Operativa y Comercial',                                    8),
    ('Gestión cultural Panóptico',                       'Procesos Misionales',    'Dirección de Proyectos y Servicios Financieros',                     9),
    ('Rueda por Ibagué',                                 'Procesos Misionales',    'Dirección de Proyectos y Servicios Financieros',                    10),
    ('Gestión de operaciones financieras',               'Procesos Misionales',    'Dirección de Proyectos y Servicios Financieros',                    11),
    -- APOYO
    ('Gestión jurídica',                                 'Procesos de Apoyo',      'Secretaría General',                                                 1),
    ('Gestión humana',                                   'Procesos de Apoyo',      'Dirección de Servicios Administrativos',                             2),
    ('Gestión de control disciplinario',                 'Procesos de Apoyo',      'Oficina de Control Disciplinario',                                   3),
    ('Gestión contractual',                              'Procesos de Apoyo',      'Secretaría General',                                                 4),
    ('Gestión documental',                               'Procesos de Apoyo',      'Dirección de Servicios Administrativos',                             5),
    ('Gestión de recursos físicos',                      'Procesos de Apoyo',      'Dirección de Servicios Administrativos',                             6),
    ('Gestión financiera',                               'Procesos de Apoyo',      'Dirección Financiera',                                               7),
    -- EVALUACIÓN
    ('Evaluación independiente',                         'Procesos de Evaluación', 'Oficina de Control Interno',                                         1)
) AS v(nombre, grupo_nombre, oficina_nombre, orden)
JOIN public.grupos_proceso g ON g.nombre = v.grupo_nombre
JOIN public.oficinas o       ON o.nombre = v.oficina_nombre
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- PASO 8: TRIGGER — Auto-crear perfil
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, cargo, rol, oficina_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'cargo', ''),
        CASE
            WHEN NEW.raw_user_meta_data->>'rol' IN
                 ('super_admin','jefe_oficina','equipo_planeacion','gerente','auditor')
            THEN NEW.raw_user_meta_data->>'rol'
            ELSE 'funcionario'
        END,
        CASE
            WHEN NEW.raw_user_meta_data->>'oficina_id' IS NOT NULL
                 AND NEW.raw_user_meta_data->>'oficina_id' <> ''
            THEN (NEW.raw_user_meta_data->>'oficina_id')::uuid
            ELSE NULL
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email           = EXCLUDED.email,
        nombre_completo = EXCLUDED.nombre_completo,
        cargo           = EXCLUDED.cargo,
        rol             = EXCLUDED.rol,
        oficina_id      = EXCLUDED.oficina_id,
        updated_at      = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- PASO 9: ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- oficinas
ALTER TABLE public.oficinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oficinas_select_all" ON public.oficinas;
CREATE POLICY "oficinas_select_all" ON public.oficinas FOR SELECT USING (true);

-- grupos_proceso
ALTER TABLE public.grupos_proceso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grupos_select_all" ON public.grupos_proceso;
CREATE POLICY "grupos_select_all" ON public.grupos_proceso FOR SELECT USING (true);

-- procesos_institucionales
ALTER TABLE public.procesos_institucionales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "procesos_select_all" ON public.procesos_institucionales;
CREATE POLICY "procesos_select_all" ON public.procesos_institucionales FOR SELECT USING (true);

-- perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfiles_own_select"     ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_own_update"     ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_admin_all"      ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_insert_trigger" ON public.perfiles;

-- Cada usuario lee/edita su propio perfil
CREATE POLICY "perfiles_own_select" ON public.perfiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfiles_own_update" ON public.perfiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- super_admin tiene acceso total
-- Se usa una función SECURITY DEFINER para evitar recursión infinita
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'super_admin'
  );
$$;

CREATE POLICY "perfiles_admin_all" ON public.perfiles
    FOR ALL USING ( public.is_super_admin() );

-- El trigger puede insertar (SECURITY DEFINER lo maneja, pero por si acaso)
CREATE POLICY "perfiles_insert_trigger" ON public.perfiles
    FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────
SELECT 'grupos_proceso: '  || count(*)::text FROM public.grupos_proceso
UNION ALL
SELECT 'oficinas: '        || count(*)::text FROM public.oficinas
UNION ALL
SELECT 'procesos: '        || count(*)::text FROM public.procesos_institucionales;
