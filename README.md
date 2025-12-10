
# 📱 RaveApp – Aplicación Mobile
Proyecto Final – Carrera Analista de Sistemas (Escuela Da Vinci)




## 📝 Descripcion General
RaveApp es una aplicación mobile desarrollada como parte del proyecto final de la carrera Analista de Sistemas de la Escuela Da Vinci.
El objetivo principal es centralizar la gestión de eventos electrónicos (raves, afters, festivales, fiestas recurrentes) y brindar una experiencia completa tanto para usuarios que asisten a eventos, como para organizadores y administradores.

La app permite:

Comprar entradas digitales con códigos QR.

Explorar eventos, filtrar, marcar favoritos y ver información detallada.

Acceder a artistas, noticias y contenido multimedia.

Crear, administrar y validar eventos (roles Organizador y Administrador).

Gestionar tickets vendidos, reportes financieros y sistema de controladores.

Escanear entradas mediante cámara para validar accesos.

El proyecto está construido siguiendo buenas prácticas de análisis funcional y documentación formal de software, con una cobertura completa de casos de uso funcionales, desde flujo de usuarios hasta operaciones avanzadas de administración.
## 🧩 Objetivo del sistema
RaveApp busca resolver dos necesidades clave del ecosistema de eventos:

✔ Para usuarios asistentes

- Registro y login (email / Google).

- Compra de entradas de forma segura (MercadoPago).

- Acceso a sus tickets digitales y posibilidad de solicitar reembolsos.

- Descubrir eventos, artistas y noticias.

- Calificar fiestas recurrentes.

✔ Para organizadores

- Crear y administrar eventos.

- Gestionar entradas y precios dinámicos.

- Ver ventas, estadísticas y reportes completos.

- Cancelar eventos y generar reembolsos masivos.

- Crear usuarios controladores y monitorear accesos.

✔ Para administradores

- Validar eventos antes de su publicación.

- Gestionar artistas, noticias, términos y condiciones.

- Ver reportes globales de ventas.
## 🔐 Roles de sistema

| Rol | Descripción |
| ------ | ------ |
| Usuario Cliente | Explora eventos, compra entradas, deja reseñas.|
| Usuario Organizador | Crea y administra eventos, ve reportes y ventas. |
| Usuario Administrador | Valida eventos, administra artistas/noticias, gestiona TyC. |
| Usuario Controlador | Escanea QR y valida entradas desde la app de control. |


La transición entre roles es dinámica: un usuario Cliente puede transformarse en Organizador al crear su primer evento.
## 🧠 Casos de uso

La documentación completa del proyecto está estructurada sobre una base sólida de 41 casos de uso, que cubren absolutamente todas las funcionalidades del sistema:

- Registro, login, login con Google, recuperación de contraseña.

- Exploración, filtros y favoritos de eventos.

- Compra, visualización y reembolso de entradas.

- Gestión completa de fiestas recurrentes y reseñas.

- Panel del Organizador: crear/modificar/cancelar eventos, ventas y reportes.

- Panel del Administrador: validar, aprobar o rechazar eventos, y CRUD de artistas y noticias.

- Control de accesos mediante escaneo de QR por parte de usuarios controladores.

Estos casos de uso definen el comportamiento del sistema, flujos principales, validaciones, excepciones y post-condiciones, y constituyen la base documental del proyecto final.
La lista completa se encuentra en el archivo de referencia.
## 🛠️ Tecnologías utilizadas (versión mobile)

Expo + React Native (TypeScript)

Expo Router para navegación.

Axios como cliente HTTP.

MercadoPago Checkout para pagos.

Google Cloud OAuth para login social (sin Firebase).

React Context + Reducers para autenticación y estados globales.

REST API para comunicación con el backend.
## 🧱 Arquitectura general

La aplicación está construida bajo los principios de:

Separación de responsabilidades (pantallas, componentes, APIs, hooks).

Normalización de modelos y tipos TypeScript.

Flujos sólidos de autenticación con refresh tokens y login técnico.

Control de permisos según rol en pantallas sensibles.
## 🎫 Módulos principales

🔹 Módulo de Autenticación

- Registro / Login manual y con Google.

- Recupero de contraseña.

- Manejo de tokens y persistencia segura.

🔹 Módulo de Eventos

- Listado, filtros, detalle, multimedia, cómo llegar.

- Compra de entradas con checkout.

- Favoritos y reseñas.

🔹 Módulo de Organizador

- Creación y modificación de eventos.

- Administración de fiestas recurrentes.

- Panel de ventas y reportes.

- Usuarios controladores.

🔹 Módulo de Administrador

- Validación de eventos (“Por aprobar”).

- CRUD de artistas y noticias.

- Actualización de Términos y Condiciones.

- Reportes de ventas globales.

🔹 Módulo de Control de Entradas

- Login de controlador.

- Escaneo y validación de QR.

- Avisos de error y estados de la entrada.
## 🎓 Sobre el proyecto académico
Este trabajo forma parte del Proyecto Final de la carrera Analista de Sistemas de la Escuela Da Vinci, donde se evaluó:

Capacidad de análisis funcional.

Redacción y documentación formal de casos de uso.

Diseño de flujos completos de negocio.

Arquitectura de software y buenas prácticas.

Desarrollo de una aplicación mobile con backend real.

La documentación detallada de casos de uso refleja el nivel de profundidad requerido en un trabajo integrador profesional.
## 🚀 Instalación y Ejecución del Proyecto

A continuación se detallan los pasos necesarios para instalar y ejecutar RaveApp en un entorno de desarrollo local utilizando Expo y Android Emulator.

### 📦 Requisitos previos

Antes de comenzar, asegurarse de tener instalado:

- Node.js (versión LTS recomendada)

- npm (incluido con Node)

- Expo CLI

- Android Studio + Android Emulator configurado

- JDK 17 (si fuera requerido por el entorno)

*🛠️ 1. Clonar el repositorio*

```bash
git clone https://github.com/Joseluisrigolino/Raveapp.git
cd Raveapp
```


*📥 2. Instalar dependencias*

```bash
npm install
```
Esto instalará todas las dependencias declaradas en package.json, incluyendo Expo, los módulos de navegación, APIs, cámaras, autenticación, etc.

*📱 3. Iniciar el emulador Android*

Abrir Android Studio → Device Manager → Start en el dispositivo deseado (Pixel, Samsung, etc.).

Alternativamente, desde consola:

```bash
emulator -avd NOMBRE_DEL_EMULADOR
```

*▶️ 4. Ejecutar la app en Android*

Una vez iniciado el emulador, correr:

```bash
npx expo run:android
```
Esto:

Compila el proyecto nativo.

Instala la app en el emulador Android.

Inicia la aplicación automáticamente.

*🧪 Notas importantes*

Para probar cámara + escaneo QR, siempre usar dispositivo físico o emulador con cámara habilitada.

En caso de errores con Gradle o SDK, abrir Android Studio → SDK Manager y verificar que estén instaladas las plataformas necesarias (Android 13 o la que estén usando en el proyecto).

Para builds reales (APK / AAB), se utiliza:
## 📬 Autor

- [@Joserigolino](https://github.com/Joseluisrigolino)

