# AI Agent Bootstrap Guide (Monorepo)

Este documento esta pensado para un agente que entra por primera vez al proyecto
o para una conversacion nueva sin contexto previo.

Objetivo: reducir tiempo de onboarding y evitar cambios incorrectos en areas
sensibles (media pipeline, works organizer, lightbox y estructura multi-app).

## 1) Mapa real del proyecto

Monorepo (raiz):

- `apps/web`: sitio publico (portfolio).
- `apps/admin-dashboard`: panel de administracion real.
- `functions`: Cloud Functions de Firebase (procesamiento de imagen/video).
- `firestore.rules`, `storage.rules`, `firebase.json`: reglas/config base.

Notas importantes de consistencia:

- Hay referencias legacy a `apps/admin` en algunos archivos de raiz.
- El panel activo hoy es `apps/admin-dashboard`.

## 2) Stack por app

### Web (`apps/web`)

- Next.js 14 + React 18 + MUI + framer-motion.
- Rutas clave:
  - `src/app/page.tsx` (Home).
  - `src/app/works/[category]/page.tsx` (Works por categoria).
  - `src/app/exhibitions/page.tsx` (Exhibitions publicas).

### Admin (`apps/admin-dashboard`)

- Next.js 16 + React 19 + Tailwind + shadcn + dnd-kit.
- Rutas clave:
  - `src/app/dashboard/works-organizer/page.tsx`
  - `src/app/dashboard/gallery/page.tsx`
  - `src/app/dashboard/exhibitions/page.tsx`
  - `src/app/dashboard/exhibitions/[exhibitionId]/page.tsx`

### Functions (`functions`)

- Node 22 + Firebase Functions v2 + ffmpeg + sharp.
- Entrypoint: `src/index.ts`
- Triggers:
  - `src/triggers/onImageUpload.ts`
  - `src/triggers/onVideoUpload.ts`
- Callable:
  - `src/callable/generateDownloadUrl.ts`
  - `src/callable/regenerateDownloadUrl.ts`
  - `src/callable/validateDelete.ts`

## 3) Modelo de datos (Firestore)

### Colecciones principales

- `media`
- `mediasets`
- `mediasets/{mediasetId}/items`
- `exhibitions`
- `about_me`, `contact`, `about_me_contact`
- `config/default` (lista de `authorizedUsers` para admin)

### `media` (resumen)

Campos relevantes:

- `type`: `image | video`
- `processed`: boolean
- `processing.stage`, `processing.progress`
- `origin.context`: `gallery | exhibition`
- `paths.original`
- `paths.derivatives` (webp/webm variants)
- `paths.poster` (video)
- `link` (opcional):
  - `provider`: `zora | objkt`
  - `url`
  - `fontColor`

### `mediasets` y `items`

`mediasets`:

- `category`: `home | caves | landscapes`
- `ordering`
- `deletedAt` (soft delete)

`items`:

- `mediaId`: media principal (single o primer item del carousel)
- `mediaItems`: array opcional para carousel
  - cada entry: `{ mediaId, order }`
- `order`
- `flex`

Regla practica:

- Si `mediaItems` tiene 2+ elementos => item de tipo carousel.
- Si no, se usa `mediaId` como item simple.

## 4) Flujo media end-to-end

1. Admin sube archivo via `uploadMediaFiles`:
   - `apps/admin-dashboard/src/lib/media-upload.ts`
   - upload a `uploads/images/...` o `uploads/videos/...`
   - metadata incluye `uploadId`, `originContext`, `originRole`, etc.
2. Trigger de Functions detecta upload:
   - crea doc inicial `media` (`processed: false`).
   - avanza `processing.stage/progress`.
   - genera derivados y poster.
   - elimina original de uploads.
   - deja `processed: true`.
3. Web/Admin resuelven src usando hook:
   - Web: `apps/web/src/hooks/useStorageAssetSrc.ts`
   - Admin: `apps/admin-dashboard/src/hooks/use-storage-asset-src.ts`
   - Ambos cachean signed urls en localStorage.

## 5) Donde tocar segun tarea

### Works organizer (admin)

- Vista principal:
  - `apps/admin-dashboard/src/app/dashboard/works-organizer/page.tsx`
- Lista y cards de items:
  - `apps/admin-dashboard/src/features/works-organizer/components/items-list.tsx`
- Dialog para asignar media/carousel:
  - `apps/admin-dashboard/src/features/works-organizer/components/assign-media-dialog-v2.tsx`
- Dialog reusado de picker:
  - `apps/admin-dashboard/src/components/media-picker-dialog.tsx`
- Links provider/url/color por media:
  - `apps/admin-dashboard/src/features/works-organizer/components/media-link-dialog.tsx`

### Render publico de works

- `apps/web/src/app/works/[category]/page.tsx`
- Fetch de categoria (incluye soporte carousel):
  - `apps/web/src/utils/functions/fetchCategoryMedia.ts`

### Home (public)

- `apps/web/src/app/page.tsx`
- Fetch home:
  - `apps/web/src/utils/functions/fetchMediaSetsWithMedia.ts`

Atencion: hoy `fetchMediaSetsWithMedia.ts` prioriza `itemData.mediaId` y no
arma `carouselMedia` como `fetchCategoryMedia.ts`.

### Exhibitions

- Web:
  - `apps/web/src/app/exhibitions/page.tsx`
- Admin:
  - `apps/admin-dashboard/src/app/dashboard/exhibitions/...`

### Gallery admin

- `apps/admin-dashboard/src/features/gallery/components/media-gallery.tsx`
- `apps/admin-dashboard/src/app/dashboard/gallery/page.tsx`

## 6) Comandos utiles

Desde cada app:

- Web:
  - `cd apps/web && npm install && npm run dev`
- Admin dashboard:
  - `cd apps/admin-dashboard && npm install && npm run dev`
- Functions:
  - `cd functions && npm install && npm run build`
  - `cd functions && npm run serve` (emulador functions)

Desde raiz (estado actual):

- `npm run dev:web` funciona.
- `npm run dev:admin` apunta a `apps/admin` (legacy). Verificar/corregir si se
  quiere usar scripts de raiz para admin.

## 7) Auth y seguridad (resumen operativo)

- Admin usa Firebase Auth + Google popup:
  - `apps/admin-dashboard/src/contexts/auth-session.tsx`
- Ademas valida autorizacion contra `config/default.authorizedUsers`.
- Firestore rules actuales permiten lectura publica amplia.
- Escrituras de varias colecciones requieren auth.

Siempre revisar impacto de seguridad antes de tocar reglas.

## 8) Convenciones para agentes (primera conversacion)

Checklist minimo antes de editar:

1. Confirmar area: `web` / `admin-dashboard` / `functions`.
2. Confirmar shape real de datos en Firestore (no asumir).
3. Buscar implementacion existente antes de crear una nueva.
4. Mantener consistencia visual con componente/patron ya usado.
5. Verificar mobile + desktop en componentes con dialog/lightbox.
6. Evitar romper flujos de signed URL y fallback.

Checklist minimo despues de editar:

1. Ejecutar lint o al menos typecheck del area tocada.
2. Probar flujo principal end-to-end.
3. Validar estados vacios/errores/carga (skeleton, fallback, loader).
4. Revisar que no queden logs de debug innecesarios.

## 9) Preguntas que el agente debe hacer si hay ambiguedad

- El cambio aplica a Home, Works por categoria, o ambos?
- Se persiste en `media.link`, `mediasets/items`, o en otra coleccion?
- El comportamiento esperado en mobile debe copiarse de cual pantalla?
- Para carousel: maximo de seleccion? orden manual? editar existente?
- Debe afectar tambien admin preview/lightbox o solo web publica?

## 10) Starter prompt recomendado (para nueva conversacion)

Usar algo como:

```txt
Lee primero AI_AGENT_BOOTSTRAP.md.
Luego revisa solo los archivos del feature que te pido.
No cambies estilos globales ni arquitectura sin avisar.
Confirma si el cambio impacta web, admin-dashboard, functions o mas de uno.
```

## 11) Riesgos conocidos / deuda tecnica visible

- Referencias legacy a `apps/admin` en:
  - `README.md` de raiz
  - scripts de `package.json` raiz
  - `apphosting.dashboard*.yaml`
- Hay diferencias de version importantes entre apps:
  - Web (Next 14, React 18)
  - Admin (Next 16, React 19)
- Parte de la documentacion del admin es template base y no representa todo el
  estado real del proyecto.

---

Si se usa este repo como template para otras empresas, conviene mantener este
archivo actualizado cada vez que cambie:

- estructura de carpetas,
- modelo de datos,
- reglas Firebase,
- o flujo de media pipeline.
