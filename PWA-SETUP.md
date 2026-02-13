# PWA Setup Guide

Your app is now configured as a Progressive Web App (PWA) and can be installed on mobile devices!

## Features

✅ **Installable** - Can be installed on Android/iOS home screen
✅ **Offline Support** - Works offline with cached content
✅ **Custom Heart Icon** - Beautiful pink heart-shaped app icon
✅ **Standalone Mode** - Runs like a native app without browser UI
✅ **Fast Loading** - Service worker caches assets for quick startup

## Installation Instructions

### On Android (Chrome)

1. Open the app in Chrome browser
2. Tap the menu (⋮) in the top-right corner
3. Select "Install app" or "Add to Home screen"
4. Confirm the installation
5. The app will appear on your home screen with the heart icon

### On iOS (Safari)

1. Open the app in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Edit the name if desired
5. Tap "Add" in the top-right corner
6. The app will appear on your home screen

### On Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the install icon (⊕) in the address bar
3. Click it and confirm installation
4. The app will open in its own window

## Testing PWA Features

### Check Service Worker Registration

Open DevTools (F12) → Console, you should see:
```
✅ Service Worker registered successfully
```

### Test Offline Mode

1. Open DevTools (F12) → Network tab
2. Check "Offline" checkbox
3. Refresh the page - it should still work!

### Verify Manifest

Open DevTools (F12) → Application tab → Manifest
- You should see "The Perfect Team" with the heart icon
- Theme color: #ec4899 (pink)
- Display mode: standalone

## PWA Files

- `public/manifest.json` - App manifest with metadata
- `public/sw.js` - Service worker for offline support
- `public/icons/` - App icons in various sizes
- `src/registerSW.ts` - Service worker registration logic

## Updating Icons

To regenerate icons after modifying `public/icons/heart-icon.svg`:

```bash
npm run generate:icons
```

## Deployment Checklist

When deploying to production:

- [ ] Ensure HTTPS is enabled (required for PWA)
- [ ] Verify manifest.json is accessible at `/manifest.json`
- [ ] Verify service worker is accessible at `/sw.js`
- [ ] Test installation on actual mobile devices
- [ ] Check that icons display correctly
- [ ] Test offline functionality

## Troubleshooting

### App not showing "Install" prompt

- Ensure you're using HTTPS (not HTTP)
- Check that manifest.json is valid
- Verify service worker is registered successfully
- Try clearing browser cache and reloading

### Icons not displaying

- Run `npm run generate:icons` to regenerate
- Check that all icon files exist in `public/icons/`
- Verify manifest.json references correct icon paths

### Service Worker not updating

- Increment the CACHE_NAME version in `public/sw.js`
- Clear browser cache and hard reload (Ctrl+Shift+R)
- Unregister old service worker in DevTools → Application → Service Workers

## Browser Support

- ✅ Chrome/Edge (Android, Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android, Desktop)
- ✅ Samsung Internet
- ⚠️ iOS Safari has limited PWA features

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.pwabuilder.com/)
- [Service Worker Guide](https://developers.google.com/web/fundamentals/primers/service-workers)
