# 🎲 La Deuda Eterna — Web Edition

> Adaptación web multijugador en tiempo real del clásico juego de mesa de estrategia económica "La Deuda Eterna".

[![Live Demo](https://img.shields.io/badge/Demo-En_vivo-brightgreen?style=for-the-badge)](https://la-deuda-eterna.onrender.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?style=for-the-badge&logo=socketdotio)](https://socket.io/)

---

## 📌 Descripción del Proyecto

**La Deuda Eterna** es una recreación web de estrategia centrada en la simulación económica y geopolítica. Permite a los jugadores unirse a salas públicas o privadas mediante códigos, gestionar activos y disputar partidas síncronas directamente desde el navegador.

---

## 🛠️ Arquitectura y Stack Técnico

- **Backend:** Node.js y Express para la entrega de estáticos y API.
- **Tiempo Real:** Socket.io para la gestión de eventos, salas y sincronización del estado global (*Stateful Backend*).
- **Persistencia:** Guardado atómico en disco tolerante a fallos y recuperación de sesión mediante tokens.
- **Frontend:** HTML5, CSS3 responsivo (Flexbox/Grid adaptativo) y JavaScript Vanilla.
- **Testing:** Suite de pruebas automatizadas para validar reglas de negocio, cobros y desconexiones.

---

## 🚀 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone [https://github.com/Stazkun99/la-deuda-eterna.git](https://github.com/Stazkun99/la-deuda-eterna.git)

# 2. Entrar a la carpeta
cd la-deuda-eterna

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm start
