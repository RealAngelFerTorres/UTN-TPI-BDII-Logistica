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
├── logistica-back.js          → Script backend de la app (punto de entrada)
├── .env.example               → Plantilla de variables de entorno (copiar como .env)
├── src/
│   ├── db.js                  → Conexión a MongoDB Atlas
│   ├── elementos.js           → CREATE y DELETE lógico de elementos
│   └── models/
│       ├── Elemento.js        → Esquema de elementos (HT y móviles)
│       └── Personal.js        → Esquema de personal
└── scripts/
    ├── seed.js                → Carga datos de prueba ficticios
    ├── demo-elementos.js      → Demo de alta y baja lógica contra Atlas
    └── test-modelo.js         → Prueba las validaciones sin conectarse
```

## 💻 Ejecución del proyecto

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env` y completar `MONGODB_URI` con el connection string de Atlas.
3. Comandos disponibles:

| Comando | Qué hace |
| --- | --- |
| `npm run test:modelo` | Valida el esquema de elementos (no necesita Atlas) |
| `npm run seed` | Carga personal y elementos ficticios (se puede repetir sin duplicar) |
| `npm run demo:elementos` | Crea un HT, lo da de baja lógica y muestra que sigue en la base |
| `npm start` | App principal |
