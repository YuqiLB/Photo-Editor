# Photo Editor

A browser-based photo editor with multiple image selection, previews, cropping,
filters, batch editing, and downloads. Photos are opened and processed on the
visitor's device; they are not uploaded to a server.

## Local development

```bash
cd vite-project
npm install
npm run dev
```

No backend is required. `backend/` contains the legacy Express upload server,
which is no longer used by the frontend.

## Cloudflare Pages

Use these build settings for the Git repository:

- Root directory: `vite-project`
- Build command: `npm run build`
- Build output directory: `dist`

Redeploy after pushing the changes. Cloudflare Pages serves the React application
and handles its client-side routes through the default SPA fallback (do not add a
top-level `404.html`). See the [Cloudflare React deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).

To preview the production build locally:

```bash
cd vite-project
npm run build
npm run preview
```

The old upload request used `http://localhost:3000/api/upload`, and the Express
server returned image URLs on that same host. On a deployed website, `localhost`
refers to the visitor's computer, not the hosting server. Deploying the frontend
to Pages does not start `backend/server.js`.

The frontend now passes selected `File` objects to the editor in browser history
state and creates temporary local image URLs for previews and canvas editing.
Each page releases its URLs when they are no longer needed. There is no remote
photo storage or shareable editing session; opening `/editor` without selected
files offers a link back to photo selection.
Browser history is not permanent storage: if the browser discards the selected
files (for example, during Back/Forward navigation after a reload), select them
again using that link.

## Manual verification

With only the frontend running (leave the Express server stopped):

1. Select or drop multiple PNG/JPEG files, remove one, and select it again.
2. Click Upload and confirm that photos appear in the editor and no request to
   port 3000 or `/api/upload` occurs in the browser's Network panel.
3. Apply a filter, crop a photo, and download the result. Repeat with batch editing.
4. Refresh the editor and use Back/Forward. Photos load when the browser retains
   the history state; otherwise, use Select photos to choose them again.
5. Open `/editor` in a new tab with no history state and follow Select photos.
6. Try an empty selection or drop a non-image file and check the inline message.
