RCCG Middle East Convention 2026 - API Background Removal Version

This version uses remove.bg through a secure Vercel serverless API route.

Required Vercel Environment Variable:
REMOVE_BG_API_KEY

Folder structure:
index.html
styles.css
app.js
package.json
api/remove-bg.js
assets/frame_base.png
assets/frame_overlay.png

Upload everything to GitHub, then deploy with Vercel.
After deployment, add REMOVE_BG_API_KEY in Vercel Project Settings > Environment Variables, then redeploy.
