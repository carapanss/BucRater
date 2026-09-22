# Servidor de sincronización de BucRater

Este servicio guarda una copia canónica de la biblioteca en SQLite y expone una
API privada para que las aplicaciones de escritorio sincronicen su snapshot.
Está pensado para escuchar únicamente en la IP de Tailscale del servidor.
Las portadas elegidas manualmente viajan dentro del snapshot como imágenes
codificadas y se reconstruyen en la carpeta local de cada dispositivo.

## Instalación en `jacob`

Desde el checkout local:

```bash
ssh jacob 'sudo install -d -o carapan -g carapan -m 750 /opt/bucrater-server /var/lib/bucrater-server /etc/bucrater-server'
scp server/app.py server/bucrater-server.service jacob:/tmp/
ssh jacob 'sudo install -o root -g root -m 755 /tmp/app.py /opt/bucrater-server/app.py && sudo install -o root -g root -m 644 /tmp/bucrater-server.service /etc/systemd/system/bucrater-server.service'
ssh jacob 'sudo systemctl daemon-reload && sudo systemctl enable --now bucrater-server.service'
```

La aplicación usa por defecto `http://100.74.38.58:8092`, por lo que no hace
falta configurar nada en los dispositivos que tengan acceso a esa red Tailscale.

Para añadir una segunda capa de autenticación, crea
`/etc/bucrater-server/bucrater-server.env` a partir de
`bucrater-server.env.example`, añade `BUCRATER_SERVER_TOKEN` y reinicia el
servicio. El mismo token puede configurarse en el archivo `server.json` de cada
instalación de BucRater.

## API

- `GET /health` — comprobación de disponibilidad.
- `GET /api/v1/snapshot` — devuelve la revisión y la biblioteca.
- `PUT /api/v1/snapshot` — guarda una nueva biblioteca usando `baseRevision`.

Las portadas individuales están limitadas a 8 MB por la aplicación y el payload
completo de una biblioteca admite hasta 128 MB.

Las revisiones usan control optimista: si dos dispositivos escriben a la vez,
el cliente recibe `409` y BucRater fusiona los cambios antes de volver a
intentarlo.
