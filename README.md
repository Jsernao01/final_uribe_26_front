# Front para metricas EcoCesde

Frontend Angular del ecosistema `EcoCesde` para:

- autenticarse contra el backend Java
- registrar clientes reales en el backend
- consumir la API analítica en Python
- mostrar KPIs, rankings, gráficos y muestras directas de usuarios y productos

## Stack

- Angular 21 con standalone components
- Angular Material
- Chart.js con `ng2-charts`
- `HttpClient` para integración real
- tema claro/oscuro persistente

## Qué hace

La aplicación expone tres flujos:

1. `Login`
   Valida credenciales reales contra `POST /auth/login` del backend.

2. `Registro`
   Crea clientes reales contra `POST /usuarios/guardar/CLIENTE`.

3. `Dashboard`
   Consume la API analítica y muestra:
   - ingresos totales
   - ticket promedio
   - producto líder
   - cliente top
   - ranking de productos
   - ranking de clientes
   - ranking de vendedores
   - mensajes de contexto de la analítica
   - muestra directa de usuarios y productos del backend

## Integración

El frontend usa proxy local para evitar problemas de CORS en desarrollo:

- `/api/back` -> `http://localhost:8080`
- `/api/analytics` -> `http://localhost:8000`

Archivo:

```text
proxy.conf.json
```

## Requisitos

- Node.js
- npm
- backend `final_uribe_26_back` corriendo en `http://localhost:8080`
- API `final_uribe_26_analitica` corriendo en `http://localhost:8000`

## Instalación

```powershell
cd "D:\Documentos\GitHub\final_uribe_26_front"
npm install
```

## Arranque

```powershell
npm start
```

La app queda en:

```text
http://localhost:4200
```

## Build

```powershell
npm run build
```

Salida:

```text
dist/front-datos
```

## Flujo recomendado

1. Arranca el backend Java.
2. Arranca la API analítica Python.
3. Arranca este frontend.
4. Si no tienes usuario, crea uno en `/register`.
5. Inicia sesión y entra al dashboard.

## Nota sobre métricas

El dashboard intenta usar ventas reales primero.

Si la API analítica detecta que no hay ventas listables en el backend, el frontend activa automáticamente modo demostración para que el panel no quede vacío. Eso se muestra visualmente en la interfaz.

## Archivos clave

```text
src/app/core/services/auth.service.ts
src/app/core/services/sales-data.service.ts
src/app/core/services/theme.service.ts
src/app/features/auth/login
src/app/features/auth/register
src/app/features/dashboard
src/styles.scss
```
