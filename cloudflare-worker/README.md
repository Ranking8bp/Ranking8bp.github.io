# Ranking8BP — Cloudflare event gateway

**Estado: preparación; NO está conectado a jugadores reales.** No cambia el ELO,
partidas, autenticación, penalizaciones ni chats oficiales, que siguen en Supabase.

## Qué funciona al desplegar

- `GET /health`: estado de la configuración (no muestra secretos).
- `GET /api/feed/ranking`: fotografía pública del ranking obtenida por RPC
  `get_cached_public_home`, caché **compartida** (Durable Object) durante 30 segundos.
- `GET /api/feed/daily`: clasificación diaria por
  `daily_classification_leaderboard`, misma caché compartida.
- Respuestas `ETag` y `304 Not Modified` si los datos no han cambiado.
- `GET /ws/public`: WebSocket para avisar de cambios de las dos tablas.
- `POST /api/room-ticket`: valida sesión mediante Supabase y comprueba la
  pertenencia a la sala antes de emitir un ticket temporal.
- `GET /ws/room?ticket=...`: canal privado; solo **avisa** de novedades,
  no transporta mensajes ni acepta GANÉ/PERDÍ/ANULAR.
- `POST /internal/event`: acepta SOLO eventos enviados por un backend con el
  secreto `EVENT_SECRET`; invalida caché y avisa por WebSocket.

No hay nuevos accesos a la base por cada visitante: las solicitudes idénticas
son atendidas desde una única instancia de caché, salvo caducidad/invalidación.

## Conectar Cloudflare

1. Desde **Workers & Pages → Create application → Import a repository**, autorizar
   GitHub y seleccionar `Ranking8bp/Ranking8bp.github.io`.
2. Tras aprobar/incorporar este cambio en la rama principal, escoger el
   **Root directory** `cloudflare-worker`.
3. Nombre del Worker: `ranking8bp-server` (debe coincidir con wrangler).
4. Comando de despliegue: `npx wrangler deploy` (build opcional/vacío).
5. En Settings → Variables and Secrets, guardar como **Secrets**:
   - `SUPABASE_ANON_KEY`: clave pública/anon/publishable existente en la
      configuración Supabase, **no** la service_role key.
   - `EVENT_SECRET`: cadena aleatoria larga para autenticar las notificaciones.
   - `TICKET_SECRET`: cadena aleatoria distinta para firmar tickets de sala.
6. Confirmar que `/health` muestre las tres configuraciones `true`.
7. **No sustituir las llamadas del sitio todavía.** Primero probar endpoints,
   sesiones, salas autorizadas y cargas. No poner el Worker en producción si
   alguna prueba falla.

**Nunca publiques secretos, JWT ni claves service_role en GitHub, capturas
de pantalla o mensajes de chat.** Configúralos solo en Cloudflare/Supabase.

## Conectar eventos (fase posterior al despliegue)

Cloudflare no ve los cambios de Supabase por sí solo. Instalar un relay seguro
(Supabase Database Webhooks + Edge Function/pg_net) que emita al Worker los
eventos **después** de confirmar una escritura:

```http
POST /internal/event
X-Event-Secret: (secreto privado)
Content-Type: application/json

{"feed":"ranking"}
{"feed":"daily"}
{"mode":"daily","room":123,"type":"chat.changed"}
{"mode":"ranked","room":456,"type":"room.changed"}
{"mode":"ranked","room":456,"type":"match.found"}
```

El relay debe enviar **solo identificadores y tipos** de evento, nunca el
texto del chat, fichas de sesión, vídeos ni datos personales. Para que la
clasificación cambie al cerrar un VS, avisar después de aplicar su resultado.
Usar un relay con secreto, reintentos y monitoreo de entregas; no ejecutar
peticiones HTTP síncronas en las transacciones PostgreSQL.

### Fallback de seguridad

Si el Worker queda fuera de servicio: clientes **deben mantener un camino de
consulta directa a Supabase**, con intervalos moderados y sin solapamientos.
Si falla un WebSocket, reconectarse con backoff y resincronizar desde Supabase.
No usar una instantánea de caché para decidir ganadores, penalizaciones,
límites de 15 partidas o autorizaciones: eso debe validarse transaccionalmente
en Supabase.

### Límite actual de esta etapa

**Emparejamiento** sigue en las RPC actuales: no se reescribe la cola sin una
migración atómica, porque podría asignar al mismo jugador a dos VS.
**Chat** sigue almacenando mensajes en Supabase. El Worker soporta
notificaciones privadas de cambios, pero no se activa hasta desplegar webhook
y conectar el cliente. Fotos e insignias mantienen sus URLs actuales; después
se aplicará caché de navegador/CDN por rutas versionadas.

El Worker puede escalar conexiones, pero no garantiza una capacidad concreta
de 1.000 jugadores sin pruebas de carga y comprobación de costos.
