RCCG Middle East Convention 2026 - Attending Photo Frame App

What this package does:
- Lets people upload a photo
- Offers automatic background removal in-browser (using the @imgly/background-removal package loaded from a CDN)
- Lets people adjust zoom and position
- Generates a downloadable PNG with the convention frame

How to use locally:
1. Unzip the folder.
2. Host it on a static server. Easiest options:
   - Vercel
   - Netlify
   - GitHub Pages (if you keep the project public or use a proper deploy workflow)
3. Open index.html through the deployed site.

Important note:
- Background removal relies on a browser-side CDN package. If you want stronger reliability and scale,
  connect a server-side API such as Cloudinary, remove.bg, or another segmentation service.

Recommended public URL examples:
- convention.yourchurch.org/attending
- rccg-middleeast-attending.vercel.app
