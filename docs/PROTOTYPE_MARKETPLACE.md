# EXE CP3 marketplace implementation

Reference: https://www.figma.com/proto/UABy3sOnkzlVcGwtQbKAJn/EXE-CP3?node-id=44-902

This extends the existing React/TypeScript frontend and Spring Boot API in the local repositories. No public deployment was created. It supersedes the earlier limited visual pass described in FIGMA_IMPLEMENTATION.md.

## Connected routes

| Route | Functionality |
| --- | --- |
| `/` | Home, search, categories, feed and inspection information |
| `/may-anh` | Full catalog, URL search/use cases/brand/type/budget/inspection/shutter/sort, pagination |
| `/may-anh/:id` | Product details, seller photos, specifications, available inspection results, cart actions |
| `/ai-tu-van` | Questionnaire opens AI chat with budget/use case/experience; actual catalog filters remain available |
| `/gio-hang` | Local cart of product IDs, removal, unavailable items and exact VND totals |
| `/thanh-toan` | Recipient details, saved addresses, delivery/showroom selection, server-priced order creation |
| `/don-hang`, `/don-hang/:id` | Buyer/seller orders, snapshots, status, deposit/balance simulation, unpaid cancellation |
| `/dang-ban` | Any signed-in active account can submit listings, condition, private serial and up to eight JPG/PNG uploads; seller verification is optional |
| `/thu-mua-may-cu` | Stored buyback requests and request history |
| `/tai-khoan` | Profile, inventory tabs, address book and order navigation |
| `/thanh-vien/:id` | Public profile with paginated live listings, sold equipment and completed-purchase reviews; accessible without signing in |
| `/tai-khoan/xac-minh` | Existing private seller verification flow |
| `/dang-nhap`, `/dang-ky` | Existing email/password account APIs |
| `/quan-tri/xac-minh`, `/quan-tri/tin-dang` | Admin verification and listing review |

Observed references include home `44:903`, catalog `44:897`, login `44:898`, registration `44:899`, account `44:902`, checkout `44:891`, confirmation `44:893`, and order detail `44:894`. The responsive implementation uses the reference's white, gray, black and olive visual system. It is not a Figma layer/token export.

## Data and behavior

The catalog uses `/api/public/products` instead of the former 24-item endpoint. Public responses exclude private serials, verification evidence and storage keys. Uploaded seller photos replace labeled equipment illustrations. Recorded inspection results and presentation metadata are shown when available; scores, warranties and discounts are not fabricated for existing DEMO devices.

Seller names in catalog cards and product details open `/thanh-vien/:id`; account navigation links to the member's own public page. Sold equipment keeps a public detail page without purchase actions. Reviews show an actual average and count, with an honest empty state when no one has reviewed. The order detail page exposes a rating/comment form only when the server confirms the viewer is the buyer of a COMPLETED, unreviewed order. Each order permits one review. Public pages omit private account/contact data and unpublished inventory. Existing fulfilment progression is not simulated by this feature, and no ratings or sales history are seeded.

New orders use a **30% deposit**, as shown in the prototype confirmation. Existing orders retain their stored rate. Deposits round per device to whole VND. Checkout uses database prices, product locks, transactional cart creation and an idempotent request UUID. It rejects self-purchase, repeated product IDs and unavailable devices. Payment stages are ordered and safe to retry. A multi-item cart creates separate device orders in one transaction. Buyers may cancel unpaid orders, releasing the reservation.

## Configuration and remaining integrations

Default API: port 8080. The ignored `.env.local` must target the running backend: `CAMERAHUB_API_URL=http://127.0.0.1:8080`. Use port 8081 only when explicitly starting the backend there with `$env:SERVER_PORT='8081'; .\scripts\Invoke-Backend.ps1 Run` from the backend repository.

- All payments and shipping charges are simulated. Real banking/QR payments and shipping updates are not connected.
- The AI chat calls OpenAI through backend-only credentials and read-only public catalog tools, with optional web search and clickable citations. History is session-scoped, not browser-supplied; messages are sent to OpenAI for processing. See `D:\CamerHub_Backend\docs\AI_ASSISTANT.md` for configuration and limits.
- Email/SMS OTP, password recovery and persistent login are not implemented.
- Showrooms require actual configured records. An empty configuration explains that pickup is unavailable and offers delivery.
- New seller listings enter Admin review. The listing form now selects brands and previews photos, retaining successful uploads when retrying failed photos in the same open form. Editing existing listings or resubmitting revisions is not yet exposed. See UI_UX_IMPROVEMENTS.md for the API compatibility and UI changes.
- Unpaid reservations can be cancelled manually. Automatic expiry release, paid-order refunds, fulfilment and warranty/return operations remain outside this implementation.
- Existing demo identities and listings are preserved. No fake showroom addresses, inspection scores or warranty records are seeded.

## Verification

`npm.cmd test` covers exact currency, 30% rounding, cart storage validation, combined use-case filters, URL state, CSRF and API errors. `npm.cmd run build` checks TypeScript and builds the production bundle.

`scripts/Invoke-Backend.ps1 Integration` checks original schema integrity, additive migration, account/session/verification behavior, server-priced checkout, deposit amounts, retry safety, self-purchase, duplicate sale, ownership, payment stages, unpaid cancellation and photo validation/access. Database fixtures roll back.
