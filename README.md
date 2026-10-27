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
    └── backup.ps1                → Backup con mongodump en resguardos_tpi/<fecha>
```

## 💻 Ejecución del proyecto

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env` y completar `MONGODB_URI` con el connection string de Atlas.
3. Comandos disponibles:

| Comando | Qué hace |
| --- | --- |
| `npm run test:modelo` | Valida los esquemas (no necesita Atlas) |
| `npm run seed` | Carga personal, elementos y movimientos ficticios (se puede repetir sin duplicar) |
| `npm run demo:elementos` | Crea un HT, lo da de baja lógica y muestra que sigue en la base |
| `npm run test:integracion` | Prueba las reglas de negocio de los servicios contra Atlas |
| `.\scripts\backup.ps1` | Genera el backup en `resguardos_tpi/<fecha>` (requiere MongoDB Database Tools) |
