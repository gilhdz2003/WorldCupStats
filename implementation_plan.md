# Mundial 2026 — Sitio Web Informativo

Sitio web informativo del FIFA World Cup 2026™ con calendario de partidos, grupos, selecciones, jugadores, estadísticas, countdown, formaciones tácticas y foro de mensajes. Datos extraídos vía ESPN CLI + APIs complementarias.

## Inspiración Visual (Referencias)

| Referencia | Elementos Clave |
|---|---|
| **FOX Sports** | Tema oscuro (#1a1a2e → #0f0f23), tarjetas de grupo con headers de color, banderas de países, countdown timer, navegación horizontal |
| **FIFA.com** | Header limpio y elegante, detalle de partido con banderas grandes, información de sede y horario, tabs de navegación |
| **ESPN** | Scoreboard con navegación por fechas, tarjetas de partido con equipos + horario + estadio, sidebar de contenido |

---

## Stack Tecnológico

- **Build**: Vite + Vanilla JS + CSS (sin frameworks)
- **Datos**: ESPN CLI (extraction) → JSON estáticos + polling en vivo
- **APIs**: ESPN (gratuita, sin key) + API-Football (100 req/día gratis) para jugadores/stats
- **Deploy**: Hostinger Business (archivos estáticos del `dist/`)
- **Idioma**: Español

---

## Fuentes de Datos

### ESPN CLI (Primario — Sin API key)

| Dato | Comando ESPN | Frecuencia |
|---|---|---|
| 48 equipos + logos | `teams list soccer fifa.world` | Build-time |
| 12 grupos + standings | `standings soccer fifa.world` | Build-time + Live |
| Calendario de partidos | `scoreboard soccer fifa.world` | Build-time + Live |
| Scores en vivo | `scores soccer fifa.world` | Polling 30s |
| Detalle de partido | `summary soccer fifa.world --event <id>` | On-demand |
| Boxscore por partido | `boxscore <event_id>` | On-demand |
| Play-by-play | `plays soccer fifa.world --event <id>` | On-demand |
| Noticias | `news soccer fifa.world` | Build-time |
| Forma reciente | `summary` (incluye form D/W/L) | On-demand |

### API-Football (Complementario — 100 req/día gratis)

| Dato | Endpoint | Uso |
|---|---|---|
| Rosters de selecciones | `/players?team={id}&season=2026` | Build-time |
| Stats de jugadores | `/players?id={id}&season=2026` | On-demand |
| Formaciones/Alineaciones | `/fixtures?lineups=true` | On-demand |
| Estadísticas de partido | `/fixtures/statistics` | On-demand |
| Información de estadios | `/venues?id={id}` | Build-time |

### Datos de fútbol-mercado (Complementario manual)

- Estilo de juego / descripción táctica: investigación manual o generada por IA
- Clasificación FIFA: disponible en FIFA.com rankings

---

## Diseño del Sistema Visual

### Paleta de Colores (Dark Mode)

```
Background Principal:    #0a0a1a (casi negro azulado)
Background Secundario:   #12122a (paneles/tarjetas)
Background Terciario:    #1a1a3e (hover states)
Superficie Elevada:      #1e1e42 (cards, modals)

Texto Primario:          #ffffff
Texto Secundario:        #8b8ba3
Texto Muted:             #5a5a72

Acento Principal:        #e2b53a (dorado FIFA)
Acento Secundario:       #00a1e4 (azul FIFA)
Acento Éxito:            #00c853
Acento Peligro:          #ff3d57
Acento Info:             #7c4dff

Bordes:                  #2a2a4a
```

### Colores por Grupo (headers de tarjeta)

```
Grupo A: #e53935 (rojo)         Grupo G: #43a047 (verde)
Grupo B: #1e88e5 (azul)         Grupo H: #f4511e (naranja profundo)
Grupo C: #fdd835 (amarillo)     Grupo I: #8e24aa (púrpura)
Grupo D: #00acc1 (cyan)         Grupo J: #3949ab (índigo)
Grupo E: #7cb342 (verde lima)   Grupo K: #d81b60 (rosa)
Grupo F: #fb8c00 (naranja)      Grupo L: #00897b (teal)
```

### Tipografía

- **Headlines**: `'Oswald'` (bold, uppercase — estilo deportivo)
- **Body**: `'Inter'` (limpio, legible)
- **Monospace** (countdown): `'JetBrains Mono'`

---

## Arquitectura del Proyecto

```
Mundial2026/
├── index.html
├── vite.config.js
├── package.json
├── implementation_plan.md
│
├── scripts/
│   ├── sync-espn.js          # Script build-time: ESPN CLI → JSON
│   ├── sync-logos.js         # Descarga logos oficiales de ESPN
│   └── sync-players.js       # Descarga rosters de API-Football
│
├── public/
│   └── logos/                # Logos oficiales ESPN (48 países)
│       ├── mex.png
│       ├── usa.png
│       └── ...
│
├── src/
│   ├── main.js               # Entry point, router, inicialización
│   ├── router.js             # Hash-based router
│   ├── espn-poll.js          # Live score polling (ESPN API directa)
│   │
│   ├── styles/
│   │   ├── index.css         # Reset + variables CSS + tokens
│   │   ├── layout.css        # Grid, contenedores, responsive
│   │   ├── components.css    # Estilos de componentes
│   │   ├── animations.css    # Micro-animaciones y transiciones
│   │   └── pages.css         # Estilos específicos de páginas
│   │
│   ├── data/
│   │   ├── groups.json       # 12 grupos con standings (ESPN sync)
│   │   ├── matches.json      # Calendario completo (ESPN sync)
│   │   ├── teams.json        # 48 equipos con logos y metadata
│   │   ├── players.json      # Rosters de selecciones (API-Football)
│   │   └── stadiums.json     # 16 estadios sede
│   │
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Countdown.js
│   │   ├── GroupCard.js
│   │   ├── MatchCard.js
│   │   ├── MatchDetail.js
│   │   ├── DateNav.js
│   │   ├── PlayerCard.js     # [NUEVO] Tarjeta de jugador con stats
│   │   ├── FormationView.js  # [NUEVO] Vista de formación táctica
│   │   ├── TeamHeader.js     # [NUEVO] Header de selección con logo
│   │   ├── ForumWidget.js    # [NUEVO] Foro/mensajes (localStorage)
│   │   ├── FlagBadge.js
│   │   └── Footer.js
│   │
│   └── pages/
│       ├── Home.js           # Hero + Countdown + Partidos del día
│       ├── Groups.js         # Grid de 12 grupos con standings
│       ├── Schedule.js       # Calendario completo con filtros
│       ├── MatchPage.js      # Detalle de partido + formaciones
│       ├── TeamPage.js       # [NUEVO] Página de selección + jugadores
│       ├── PlayerPage.js     # [NUEVO] Página de jugador individual
│       ├── Teams.js          # [NUEVO] Grid de 48 selecciones
│       └── Stadiums.js       # [NUEVO] Sedes y estadios
```

---

## Proposed Changes

### Fase 1 — Fixes + Datos Reales (Prioridad Crítica)

#### [FIX] Countdown.js — Labels en español
- Cambiar "Days" → "Días", "Hrs" → "Horas", "Min" → "Min", "Sec" → "Seg"

#### [FIX] DateNav.js — Fechas dinámicas
- Generar fechas del 11 Jun al 19 Jul 2026 dinámicamente
- Eliminar fechas hardcodeadas

#### [FIX] Schedule.js — Memory leak listener
- Usar delegación de eventos en vez de `window.scheduleListenerAdded`
- Limpiar intervalos en cambio de ruta

#### [FIX] MatchDetail.js — ID parsing frágil
- Usar data attribute o formato más robusto para extraer match number

#### [NEW] scripts/sync-espn.js
- Ejecuta `espn-pp-cli` para extraer datos de ESPN
- Genera `groups.json`, `matches.json`, `teams.json` con datos reales
- Se corre como `npm run sync` antes de build

#### [NEW] scripts/sync-logos.js
- Descarga logos de `https://a.espncdn.com/i/teamlogos/countries/500/{code}.png`
- Los guarda en `public/logos/`
- 48 logos, ~500KB total

#### [UPDATE] src/data/groups.json
- 12 grupos reales del Mundial 2026 (verificados con ESPN)
- Incluir: id, name, teams (con displayName, abbreviation, espnId, logo path)
- Incluir standings: GP, W, D, L, GF, GA, PTS, Rank

#### [UPDATE] src/data/matches.json
- Todos los partidos de fase de grupos (72+ partidos)
- Datos de ESPN: id, date, time, homeTeam, awayTeam, stadium, city, broadcast
- Estructura compatible con polling en vivo

#### [UPDATE] src/data/teams.json
- 48 equipos con datos de ESPN: displayName, abbreviation, color, logo, espnId
- Incluir: confederation, FIFA ranking (manual)

#### [UPDATE] src/data/stadiums.json
- 16 estadios sede completos
- Incluir: name, city, country, capacity, image (placeholder)

---

### Fase 2 — Páginas Core (Prioridad Alta)

#### [UPDATE] src/pages/Home.js — Dashboard de valor inmediato
```
┌─────────────────────────────────────────────┐
│                  NAVBAR                      │
├─────────────────────────────────────────────┤
│              HERO SECTION                    │
│        MUNDIAL FIFA 2026™                   │
│   🇺🇸 Estados Unidos • 🇲🇽 México • 🇨🇦 Canadá │
├──────────────────────┬──────────────────────┤
│   COUNTDOWN TIMER    │  ÚLTIMAS NOTICIAS    │
│   25 DÍAS 21 HRS    │  [news desde ESPN]   │
│   54 MIN 49 SEG      │                      │
├──────────────────────┴──────────────────────┤
│        PARTIDOS DEL DÍA                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ MEX vs   │ │ KOR vs   │ │ CAN vs   │    │
│  │ RSA      │ │ CZE      │ │ BIH      │    │
│  │ 13:00    │ │ 20:00    │ │ 12:00    │    │
│  │ [EN VIVO]│ │ Próximo  │ │ Próximo  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│      PRÓXIMOS PARTIDOS (siguientes días)     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Match 4  │ │ Match 5  │ │ Match 6  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│              FOOTER                          │
└─────────────────────────────────────────────┘
```

#### [UPDATE] src/pages/Groups.js — Standings con stats
```
┌─────────────────────────────────────────────┐
│         GRUPOS DEL MUNDIAL                  │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ GRUPO A                              │    │
│  │ #  Equipo      PJ V E P GF GC PTS   │    │
│  │ 1  🇲🇽 México   0  0 0 0  0  0   0  │    │
│  │ 2  🇨🇿 Chequia   0  0 0 0  0  0   0  │    │
│  │ 3  🇰🇷 Corea S.  0  0 0 0  0  0   0  │    │
│  │ 4  🇿🇦 S. Africa  0  0 0 0  0  0   0  │    │
│  └─────────────────────────────────────┘    │
│  ... (12 grupos en grid responsive)         │
└─────────────────────────────────────────────┘
```
- Cada equipo clickable → `#/team/{code}`
- Clic en grupo header → filtra Schedule por grupo

#### [UPDATE] src/pages/Schedule.js — Calendario completo
- DateNav con TODAS las fechas del mundial (Jun 11 - Jul 19)
- Filtro por grupo (dropdown)
- Indicador de "En Vivo" para partidos en curso
- Badges de broadcast (FOX, Telemundo, Peacock)

#### [UPDATE] src/pages/MatchPage.js — Detalle enriquecido
```
┌─────────────────────────────────────────────┐
│          Grupo A • Partido 1                │
│                                              │
│   🇲🇽              13:00              🇿🇦    │
│  MÉXICO          ─────────      SUDÁFRICA   │
│                                              │
│  FORMACIÓN PROBABLE                         │
│  ┌─────────────────────────────────────┐    │
│  │  México 4-3-3                        │    │
│  │      [GK]                            │    │
│  │   [LB][CB][CB][RB]                   │    │
│  │    [CM][CM][CM]                      │    │
│  │   [LW][ST][RW]                       │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ESTADÍSTICAS DEL PARTIDO                   │
│  Posesión:    55% ━━━━━━━░░ 45%             │
│  Tiros:         8 ━━━━━━░░░ 5              │
│  Córners:       6 ━━━━━░░░░ 4              │
│                                              │
│  COMENTARIOS / FORO                         │
│  [input de mensaje]                         │
│  ┌─ @usuario1: "Vamos México!" ──────────┐ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### Fase 3 — Selecciones y Jugadores (Prioridad Alta)

#### [NEW] src/pages/Teams.js — Grid de 48 selecciones
```
┌─────────────────────────────────────────────┐
│         SELECCIONES DEL MUNDIAL             │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 🇲🇽  │ │ 🇺🇸  │ │ 🇨🇦  │ │ 🇧🇷  │      │
│  │MÉXICO│ │ USA  │ │CANADA│ │BRAZIL│      │
│  │ FIFA │ │ FIFA │ │ FIFA │ │ FIFA │      │
│  │ #14  │ │ #16  │ │ #47  │ │  #5  │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│  ... (48 selecciones en grid 4x12)          │
└─────────────────────────────────────────────┘
```

#### [NEW] src/pages/TeamPage.js — Página de selección
```
┌─────────────────────────────────────────────┐
│  🇲🇽 MÉXICO                                 │
│  FIFA Ranking: #14 | Confederación: CONCACAF│
│  Grupo A • 3 partidos programados           │
├─────────────────────────────────────────────┤
│  JUGADORES CONVOCADOS                       │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 👤   │ │ 👤   │ │ 👤   │ │ 👤   │      │
│  │Ochoa │ │Álvarez│ │Lozano│ │Jiménez│     │
│  │  GK  │ │  MF  │ │  FW  │ │  FW  │      │
│  │Real S│ │West H│ │PSV   │ │Fulham│      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                              │
│  PARTIDOS DEL GRUPO                         │
│  ┌──────────────────────────────────────┐   │
│  │ MEX vs RSA | JUN 11 | Estadio Azteca│   │
│  │ MEX vs KOR | JUN 17 | Estadio Akron │   │
│  │ MEX vs CZE | JUN 23 | Estadio BBVA  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  FORMA RECIENTE (amistosos)                 │
│  D W W L D  (últimos 5)                    │
└─────────────────────────────────────────────┘
```

#### [NEW] src/pages/PlayerPage.js — Página de jugador
```
┌─────────────────────────────────────────────┐
│  ← Volver a Selección México               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────┐  HIRVING LOZANO                     │
│  │ 👤 │  Posición: Extremo Derecho          │
│  │    │  Club: PSV Eindhoven                │
│  └────┘  Edad: 30                           │
│                                              │
│  ESTADÍSTICAS DE TEMPORADA (Club)           │
│  ┌────────────────────────────────────┐     │
│  │ Partidos:  32  │ Goles: 12         │     │
│  │ Asistenc:  8  │ Minutos: 2,450    │     │
│  │ Amarillas: 3  │ Rojas: 0          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  PALMARÉS                                   │
│  • Eredivisie 2023-24                       │
│  • Copa MX 2018                             │
│                                              │
│  ESTILO DE JUEGO                            │
│  Velocidad desbordante, bueno en el 1v1.    │
│  Prefiere cortar hacia el centro para       │
│  rematar con la izquierda.                  │
└─────────────────────────────────────────────┘
```

#### [NEW] src/components/PlayerCard.js
- Tarjeta con foto placeholder + nombre + posición + club
- Clickeable → página individual del jugador
- Tamaños: sm (grid), md (lista), lg (detalle)

#### [NEW] src/components/FormationView.js
- SVG/Canvas conformation táctica (4-3-3, 4-4-2, etc.)
- Posiciones de jugadores en el campo
- Colores por posición (GK, DEF, MID, FWD)
- Responsive

#### [NEW] src/components/TeamHeader.js
- Logo grande de la selección + nombre + ranking FIFA
- Metadata: confederación, grupo, colores del equipo

#### [NEW] src/data/players.json
- Rosters de las 48 selecciones (~26 jugadores cada una = ~1,248 jugadores)
- Cada jugador: `{ id, name, position, club, clubCountry, age, stats: {...} }`
- Fuente: API-Football + datos generados manualmente/IA para estilo de juego

---

### Fase 4 — Foro y Comunidad (Prioridad Media)

#### [DONE] src/components/ForumWidget.js — localStorage (MVP actual)
- Sistema de comentarios simple por partido/selección
- Almacenamiento: localStorage (sin backend — cada usuario ve solo sus comentarios)
- Formato: `{ id, matchId, author, message, timestamp }`
- Username guardado en localStorage
- Moderación básica (filtro de palabras)

#### [NEW] Backend de comentarios — Hostinger MySQL + PHP mini-API
> **Decisión**: Usar MySQL incluido en el plan Hostinger Business + endpoints PHP simples.
> **Por qué**: Proyecto personal, pocos usuarios, no justifica crear proyecto Supabase nuevo.
> Hostinger ya tiene MySQL y PHP — todo queda en el mismo hosting sin dependencias externas.

**Esquema de tabla:**
```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id VARCHAR(50) NOT NULL,   -- ej: "team-ARG", "match-760415"
  author VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_thread (thread_id)
);
```

**Endpoints PHP:**
- `GET /api/comments.php?thread=team-ARG` → JSON array de comentarios
- `POST /api/comments.php` → `{ thread_id, author, message }` → inserta y retorna ID

**Frontend changes:**
- ForumWidget.js: reemplazar `localStorage` por `fetch()` a `/api/comments.php`
- Al cargar página: GET comentarios del thread
- Al enviar: POST nuevo comentario, re-renderizar lista
- Fallback gracioso si la API falla (mostrar error, no romper página)

**Archivos nuevos:**
- `public/api/comments.php` — CRUD endpoint con PDO + prepared statements (SQL injection safe)
- `public/api/config.php` — Connection string MySQL (credenciales en variables de entorno o config fuera de public_html)

**Seguridad:**
- Prepared statements (PDO) — anti SQL injection
- `htmlspecialchars()` — anti XSS
- Rate limiting básico (máx 5 comentarios por minuto por IP)
- Máximo 500 caracteres por mensaje

---

### Fase 5 — Live Scoring (Prioridad Media)

#### [NEW] src/espn-poll.js
- Polling a ESPN API cada 30 segundos cuando hay partidos en vivo
- Actualiza DOM directamente (score, status, time)
- Solo activo en páginas Home y Schedule
- Cleanup en cambio de ruta
- Endpoint directo: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`

#### [UPDATE] src/components/MatchCard.js
- Estados: `scheduled`, `live`, `halftime`, `finished`
- Live: score actualizado + minuto del partido + punto verde pulsante
- Finished: score final + "FT" badge
- Scheduled: hora del partido

#### [UPDATE] src/pages/Home.js
- Sección "En Vivo" destacada arriba cuando hay partidos activos
- Auto-refresh cada 30s

---

### Fase 6 — Polish (Prioridad Baja)

- Responsive design refinado (mobile-first)
- SEO y meta tags dinámicos
- PWA / manifest.json (offline de datos estáticos)
- Modo claro (toggle) — opcional
- Banderas SVG reales de flagcdn.com (reemplazar logos ESPN si se prefiere)

---

## Plan de Datos ESPN → JSON

### Script: scripts/sync-espn.js

```bash
# 1. Obtener equipos (48 selecciones)
espn-pp-cli teams list soccer fifa.world --agent > /tmp/teams_raw.json

# 2. Obtener grupos/standings
espn-pp-cli standings soccer fifa.world --agent > /tmp/standings_raw.json

# 3. Obtener calendario completo (iterar por fecha)
for date in $(seq -f "2026-06-%02g" 11 30) $(seq -f "2026-07-%02g" 1 19); do
  espn-pp-cli scoreboard soccer fifa.world --agent --date $date >> /tmp/scoreboard_raw.json
done

# 4. Parsear y generar JSONs limpios en src/data/
node scripts/parse-espn.js
```

### Script: scripts/sync-logos.js

```bash
# Descargar logos oficiales de ESPN
# URL pattern: https://a.espncdn.com/i/teamlogos/countries/500/{code}.png
# donde code = abbreviation en lowercase (mex, usa, bra, etc.)
```

---

## Verification Plan

### Build
```bash
npm run sync    # Sincroniza datos de ESPN
npm run dev     # Desarrollo local
npm run build   # Build para producción (deploy a Hostinger)
```

### Browser Testing
- Cada página renderiza correctamente
- Countdown en tiempo real (labels en español)
- Navegación entre páginas funciona (router)
- Grid de grupos muestra standings
- Calendario filtra por fecha dinámicamente
- Páginas de equipo muestran jugadores
- Páginas de jugador muestran stats
- Formación táctica se renderiza
- Foro guarda y muestra mensajes (localStorage)
- Live scoring actualiza scores
- Responsive en mobile (375px) y tablet (768px)

### Deploy
- Contenido de `dist/` se sube a `public_html/` en Hostinger
- Sin necesidad de Node.js en servidor (100% estático)
- Logos e imágenes servidos desde `/logos/`
