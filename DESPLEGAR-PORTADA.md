# Portada estática en Render

Primero sube estos cambios a GitHub y espera a que el Web Service actual termine su despliegue. Necesita el nuevo archivo entry-link.js y la comprobación pública de /health.

Después crea **New → Static Site**, conectado al mismo repositorio:

| Campo | Valor |
| --- | --- |
| Name | la-deuda-eterna-web (o el nombre disponible que prefieras) |
| Branch | main |
| Root Directory | vacío |
| Build Command | node scripts/build-landing.js |
| Publish Directory | dist-landing |
| Environment Variables | SKIP_INSTALL_DEPS = true |

El paso de construcción usa solo Node, sin dependencias. Render proporciona RENDER_EXTERNAL_URL y se usa para generar el canonical, sitemap, robots y enlaces de la nueva portada. Si añades un dominio propio, configura SITE_URL con su origen HTTPS y vuelve a desplegar. GAME_URL es opcional y apunta por defecto a https://la-deuda-eterna.onrender.com. No publiques directamente landing: contiene plantillas.

## Funcionamiento

La portada recoge nombre y código, y consulta /health para despertar el servidor. Espera hasta 100 segundos y permite cancelar o reintentar. El nombre y la intención de entrada viajan en el fragmento de la URL, sin tokens ni credenciales. El juego reutiliza su sesión del navegador y confirma la creación/entrada por su conexión Socket.IO habitual. El fragmento se retira después de la respuesta. La selección de personaje sigue en la sala para respetar la disponibilidad real.

No hace falta ampliar ALLOWED_ORIGINS del servidor: el socket se abre desde el propio juego; solo /health permite lectura pública entre orígenes y no devuelve información de salas. El acceso directo antiguo, APK y EXE siguen funcionando.

## Verificación tras desplegar

1. Abre la dirección nueva y comprueba que la portada carga aunque el juego esté dormido.
2. Crea una sala; prueba unirte desde otro navegador con su código.
3. Recarga el juego y comprueba que recupera tu plaza. Prueba un código inexistente: debe mostrar un error sin crear una sala.
4. Abre /robots.txt y /sitemap.xml en el sitio estático: deben mencionar su dirección real, sin __SITE_URL__.
5. Añade la nueva dirección como propiedad de prefijo de URL en Search Console. Se copia el archivo de verificación Google existente, pero debes confirmar que Search Console acepta ese método para la propiedad nueva; si pide otro archivo, añádelo a public y vuelve a desplegar.
6. Envía sitemap.xml y solicita indexación de la portada. El alojamiento estático evita el bloqueo del servidor dormido, pero no garantiza indexación.

Conserva el servicio del juego. No se redirige automáticamente su URL ni se cambia su canonical antes de verificar el nuevo sitio. La nueva portada tiene su propio canonical. Los cambios de GitHub actualizan ambos servicios.

## Desarrollo local

En PowerShell, desde la carpeta del proyecto:

```powershell
$env:SITE_URL = 'http://localhost:3010'
$env:GAME_URL = 'http://localhost:3001'
node scripts/build-landing.js
Remove-Item Env:SITE_URL, Env:GAME_URL
```

Sirve dist-landing con un servidor estático y arranca el juego aparte. La salida generada está ignorada por Git; sube los archivos fuente y el script de construcción.
