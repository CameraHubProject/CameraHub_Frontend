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

Set `CAMERAHUB_API_URL=http://127.0.0.1:8081` in the frontend's ignored `.env.local` only when the backend actually runs on 8081. For the normal IntelliJ/backend configuration on 8080, use `CAMERAHUB_API_URL=http://127.0.0.1:8080` or remove that override. Vite reloads when this file changes. Backend database credentials stay in the backend's ignored `.env`.

## Implemented

Home, full catalog and filters, product detail and inspection results, advisor questionnaire, device-local cart, recipient/address book, showroom selection, simulated checkout and 30% deposit, order tracking, listings and photo uploads for any signed-in active account, buyback requests, account profile, optional seller verification, and Admin reviews. Seller verification is not required to submit a listing; new listings still enter Admin review.

Existing demo users and eight demo listings are preserved. Actual seller photos are used when available; equipment illustrations are labeled. No inspection scores or warranty records are fabricated.

Payments and shipping charges are simulated. AI consultation connects to OpenAI through the backend, with public inventory tools and optional web search/citations. Configure only the backend's `OPENAI_API_KEY`; never add an API key to frontend environment variables. OTP, banking, live shipping and warranty/return operations are not connected. Full limits are recorded in the implementation document.

## Verify

```powershell
npm.cmd test
npm.cmd run build
```

Backend kiểm thử: chạy `scripts/Test-Authentication.ps1` và `scripts/Test-Microservices.ps1` từ repository backend. Những script này tạo fixture thử nghiệm riêng.

## Deploy Render

Frontend production build bằng `deploy/render/Dockerfile`: Nginx phục vụ React và chuyển `/api/*` qua `GATEWAY_HOSTPORT` trên mạng private. Không cấu hình API key hoặc JWT private key ở frontend. Blueprint triển khai cho cả hệ thống và dự toán chi phí nằm trong repository backend: `render.yaml` và `docs/DEPLOY_RENDER.md`.
