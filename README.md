# RegiHub – GH Pages Build (IndexedDB + SW)

This build includes:
- Branded theme + logo
- Calendar + Tasks
- IndexedDB + LocalStorage persistence
- Service Worker (offline app shell) compatible with GitHub Pages subpaths

## Local test
- Serve from a local web server (needed for service workers). Quick options:
  - Python: `python -m http.server 8080` then open http://localhost:8080/regihub-site/
  - VS Code: use **Live Server**

## Deploy to GitHub Pages
1. Create a new repo (e.g., `regihub-site`).
2. Add these files at the repo **root** (keep the folder structure).
3. Commit & push to `main` (or `master`).
4. In **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` / root (`/`)
5. The site will be available at `https://<username>.github.io/<repo>/`.

### Notes
- Because assets are referenced **relative to the current path**, this build works whether you host at the root or under `/your-repo/`.
- After deploying, do a **hard refresh** once to update the service worker (Ctrl/Cmd + Shift + R).
- Events are stored in **IndexedDB** and mirrored to **LocalStorage**. They persist per device & browser. To sync across devices, a backend (e.g., Google Calendar/Graph API/DB) would be needed.
