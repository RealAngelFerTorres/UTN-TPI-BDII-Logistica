# 💻 Bases de Datos II

**Tecnicatura Universitaria en Programación**  
 _Universidad Tecnológica Nacional_

## ✨ Estudiantes

**Nombres:** Khiara Razzolini & Angel Fernando Torres

## 📂 Descripción del Repositorio

Este repositorio almacena el código solicitado en el Trabajo Práctico Integrador de la asignatura **Bases de Datos II**.

## 📌 Estructura del repositorio

```text
UTN-TPI-BDII-Logistica/
├── .env.example                  → Plantilla de variables de entorno (copiar como .env)
├── src/
│   ├── db.js                     → Conexión a MongoDB Atlas
│   ├── models/
│   │   ├── Elemento.js           → Esquema de elementos (HT y móviles)
│   │   ├── Personal.js           → Esquema de personal
│   │   └── Movimiento.js         → Esquema de movimientos (salidas y entradas)
│   └── services/
│       ├── elementoService.js    → CREATE y DELETE lógico de elementos
│       ├── personalService.js    → Búsqueda y DELETE lógico de personal
│       └── movimientoService.js  → CREATE, READ, UPDATE y DELETE lógico de movimientos
└── scripts/
    ├── seed.js                   → Carga datos de prueba ficticios
    ├── demo-elementos.js         → Demo de alta y baja lógica contra Atlas
    ├── test-modelo.js            → Prueba las validaciones sin conectarse
    ├── test-integracion.js       → Prueba los servicios contra Atlas (base logistica_pruebas)
    ├── main-create.js            → Demostración CREATE
    ├── main-read.js              → Demostración READ
    ├── main-update.js            → Demostración UPDATE
    ├── main-delete.js            → Demostración DELETE
    └── backup.ps1                → Backup con mongodump en resguardos_tpi/
    <fecha>
    └── restore.ps1               → Restauración de la db del dia de <hoy>
    └── rto.ps1                   → Idem anterior, con RTO


```

## 💻 Ejecución del proyecto

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env` y completar `MONGODB_URI` con el connection string de Atlas.
3. Comandos disponibles:

| Comando                    | Qué hace                                                                          |
| -------------------------- | --------------------------------------------------------------------------------- |
| `npm run test:modelo`      | Valida los esquemas (no necesita Atlas)                                           |
| `npm run seed`             | Carga personal, elementos y movimientos ficticios (se puede repetir sin duplicar) |
| `npm run demo:elementos`   | Crea un HT, lo da de baja lógica y muestra que sigue en la base                   |
| `npm run test:integracion` | Prueba las reglas de negocio de los servicios contra Atlas                        |
| `npm run main-create`      | Demostración de la función CREATE                                                 |
| `npm run main-read`        | Demostración de la función UPDATE                                                 |
| `npm run main-update`      | Demostración de la función UPDATE                                                 |
| `npm run main-delete`      | Demostración de la función DELETE                                                 |
| `npm run backup`           | Genera el backup en `resguardos_tpi/<fecha>` (requiere MongoDB Database Tools)    |
| `npm run restore`          | Restaura la db a partir del backup creado del dia de la fecha                     |
| `npm run rto`              | Restaura la db a partir del backup creado del dia de la fecha y muestra el RTO    |

CONSEJO: Se recomienda que la terminal no ajuste con salto de línea para mejor
visualización de las tablas (hacer un cls -clear screen- y luego
presionar ALT + Z en la terminal)

Con respecto al RTO: No tiene que haber una base restaurada, en ese caso no
se restaurará nada.
