# CameraHub Frontend

React 19, TypeScript, Vite and TanStack Query. This repository contains the EXE CP3 prototype implementation, connected to the Spring Boot backend in `D:\CamerHub_Backend`.

See [routes, API behavior and integration limits](docs/PROTOTYPE_MARKETPLACE.md).

## Run

Requires Node 22.12+.

```powershell
Set-Location D:\CameraHub_Frontend
npm.cmd ci
npm.cmd run dev
```

Open `http://127.0.0.1:5173`. Vite normally proxies `/api` to port 8080.

```powershell
Set-Location D:\CamerHub_Backend
.\scripts\Invoke-Backend.ps1 Run
```

If another backend already uses 8080, run the new API on 8081:

```powershell
$env:SERVER_PORT='8081'
.\scripts\Invoke-Backend.ps1 Run
```

Set `CAMERAHUB_API_URL=http://127.0.0.1:8081` in the frontend's ignored `.env.local`. This session uses that setting and keeps the existing IntelliJ process untouched. Backend database credentials stay in the backend's ignored `.env`.

## Implemented

Home, full catalog and filters, product detail and inspection results, advisor questionnaire, device-local cart, recipient/address book, showroom selection, simulated checkout and 30% deposit, order tracking, verified-seller listings and photo uploads, buyback requests, account profile, seller verification, and Admin reviews.

Existing demo users and eight demo listings are preserved. Actual seller photos are used when available; equipment illustrations are labeled. No inspection scores or warranty records are fabricated.

Payments and shipping charges are simulated. External AI, OTP, banking, live shipping and warranty/return operations are not connected. Full limits are recorded in the implementation document.

## Verify

```powershell
npm.cmd test
npm.cmd run build
```

Backend integration tests: `D:\CamerHub_Backend\scripts\Invoke-Backend.ps1 Integration`. Database fixtures roll back. Optional demo accounts are documented in `D:\CamerHub_Backend\docs\DEMO.md`.
