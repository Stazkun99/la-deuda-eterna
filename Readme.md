# 🎲 La Deuda Eterna — Multiplatform & Web Edition

Adaptación multijugador en tiempo real del clásico juego de mesa de estrategia económica "La Deuda Eterna". Esta versión incluye el servidor web completo, cliente responsivo y aplicaciones nativas empaquetadas para **Android (.apk)** y **Windows (.exe)** mediante Capacitor y Electron/Node.

---

## 📌 Descripción del Proyecto

Recreación de estrategia centrada en la simulación económica y geopolítica. Permite a los jugadores unirse a salas públicas o privadas mediante códigos, gestionar activos, realizar alianzas y disputar partidas síncronas directamente desde el navegador o la aplicación móvil/escritorio.

---

## 🛠️ Arquitectura y Stack Técnico

* **Backend**: Node.js y Express para la entrega de estáticos y API.
* **Tiempo Real**: Socket.io para la gestión de eventos, salas y sincronización del estado global (*Stateful Backend*).
* **Entorno de Compilación**: Java JDK 21 y Gradle para compilación de artefactos Android.
* **Móvil / Multiplataforma**: Capacitor 6 empaquetando la aplicación web hacia Android Native.
* **Persistencia**: Guardado atómico en disco tolerante a fallos (`data/partidas.json`) y recuperación de sesión mediante tokens de secreto.
* **Frontend**: HTML5, CSS3 responsivo (Flexbox/Grid adaptativo) y JavaScript Vanilla.
* **Testing**: Suite de pruebas automatizadas para validar reglas de negocio, cobros y desconexiones.

---

## 🚀 Instalación y Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Stazkun99/la-deuda-eterna.git
cd la-deuda-eterna

```

### 2. Instalar dependencias

```bash
npm install

```

### 3. Iniciar servidor de desarrollo

```bash
npm start

```

Abre `http://localhost:3001` en tu navegador.

---

## 📱 Compilación del APK para Android

Para generar manualmente el archivo ejecutable de Android (`app-debug.apk`):

1. Requisitos previos: Ten instalado **JDK 21** y las herramientas de Android SDK.
2. Sincronizar activos web con Capacitor:
```powershell
npx cap sync android

```


3. Compilar el instalador Android desde PowerShell:
```powershell
cd android
.\gradlew assembleDebug

```


4. Ubicación del archivo generado:
`android\app\build\outputs\apk\debug\app-debug.apk`

---

## 📦 Descargas y Ejecutables (Releases)

Los binarios compilados no se suben al historial de Git para mantener el repositorio liviano. Puedes descargar los ejecutables directamente desde la sección de **Releases** de GitHub:

* **Android (`.apk`)**: Para instalar en teléfonos o tablets.
* **Windows (`.exe`)**: Aplicación ejecutable de escritorio.

---

## ✨ Características y Mecánicas Principales

* **Salas y Multijugador**: Hasta 4 jugadores por sala con gestión de anfitrión y códigos privados.
* **Tablero Dinámico**: Casillas con propietarios, industrias y vista adaptativa para móviles.
* **Fases de Turno Explicitas**: Gestión previa, tirada de dados, decisiones de compra/pago, gestión final y cierre.
* **Economía y FMI**: Devaluaciones, subastas de 30 segundos, créditos, dumping, monopsonios e industrialización.
* **Alianzas**: Cajas comunes y gestión conjunta de deudas manteniendo propietarios individuales.
* **Visuales Originales**: Cartas de Solidaridad y condiciones FMI integradas en formato `WebP` directamente desde el catálogo original.
* **Reconexión Automática**: Margen de 60 segundos ante desconexiones con resolución pasiva de turnos tras inactividad.

---

## 🌐 Despliegue en Render (Servidor)

1. Usa `npm ci` como comando de instalación y `npm start` como comando de inicio con Node.js 22+.
2. Configura `/health` como ruta para *Health Check*.
3. Establece la variable `DATA_DIR` apuntando a un disco persistente (ej: `/var/data/deuda-eterna`) para conservar las partidas entre despliegues.

---

## 🧪 Pruebas Automáticas

Ejecuta la suite de pruebas del servidor y reglas de negocio con:

```bash
npm test
npm run check

```
