# CameraHub prototype implementation

The later connected marketplace implementation is documented in [PROTOTYPE_MARKETPLACE.md](PROTOTYPE_MARKETPLACE.md). The text below records the earlier limited visual pass and is retained for historical reference.

Design source: [EXE CP3 prototype](https://www.figma.com/proto/UABy3sOnkzlVcGwtQbKAJn/EXE-CP3?node-id=44-897&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=50%3A1583).

The prototype was inspected in the browser. The visual direction is white and light gray surfaces, black buttons, olive highlights, rounded panels, compact typography, a shared navigation bar and a sidebar catalog with three product columns on desktop. Dimensions and colors are visual approximations; no Figma layer/token export was available.

| Figma frame | Implemented frontend |
| --- | --- |
| 44:903 | Home `/`: shared navigation, hero composition, three actions, search panel, equipment cards and footer |
| 44:897 | Catalog `/may-anh`: search, quick filters, sidebar, result count, sorting and product grid |
| 44:898 | Login `/dang-nhap`: centered white account panel, tabs, icon inputs and blurred background |
| 44:899 | Registration `/dang-ky`: same account panel with full name, email, optional phone and password confirmation |

`src/prototype.css` contains the new visual layer; `src/styles.css` retains existing shared components and home sections. `SiteLayout.tsx` provides shared navigation/footer for home, catalog and account screens. Header and footer links work across routes, including home section anchors. Account/seller review business behavior is preserved.

Catalog filters are encoded in URL parameters (`q`, repeatable `brand` and `type`, `budget`, `inspection`, `shutter`, `sort`). The result set uses the existing backend feed of up to 24 newest published listings. Manufacturer/type/budget/inspection/shutter filters combine; numeric VND sorting uses BigInt. Shutter filtering excludes missing values; shutter sorting puts them last. A reset clears all filters. The sidebar collapses into an expandable filter panel on narrow screens.

## Mapping the design to actual functionality

- Product titles, manufacturers, model names, prices, shutter counts, condition notes and inspection status come from the existing backend. Counts use returned data.
- Generic camera/lens/flash SVG illustrations are explicitly labeled as illustrations. They are not extracted photographs from Figma or photographs of the listed devices.
- The prototype's sample inspection scores, discounts, warranty promises and claims that all equipment passed 23 checks are not backed by this database and are not shown as factual product attributes.
- Quick filters use equipment type and budget because purpose/experience metadata is not available in the current feed. The existing budget picker remains available from navigation; an AI model is not connected.
- Registration uses the backend's existing email login and 12-character minimum password. The design's phone OTP, showroom address and persistent login checkbox are not connected features. Password confirmation and show/hide controls work locally.
- The seller/account links open the working account and verification flow. Cart, checkout, chat and listing creation are not implemented by this visual update.

## Verification

`npm.cmd test` covers existing health/product/identity contracts plus URL filter round-trip, combined filters, exact integer sorting, unknown shutter counts and unsupported query values. `npm.cmd run build` performs the TypeScript and production bundle checks.

Browser checks cover the desktop catalog at 1280px and mobile layout at 360px, budget selection, sort control, product information dialog, a truthful empty result when no certified listings match, account login and mobile navigation/filter controls. Evidence screenshots are stored under the ignored `.local` directory.
