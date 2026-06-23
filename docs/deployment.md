# Deployment Guide

## GitHub Pages (Automated)

CropCanvas deploys automatically via GitHub Actions on every push to `main`.

### How It Works

The workflow at `.github/workflows/deploy.yml`:
1. Checks out the repository
2. Installs Node.js 20 and runs `npm ci`
3. Runs `npm run build` (Vite production build)
4. Uploads the `dist/` directory as a Pages artifact
5. Deploys to GitHub Pages

### Initial Setup

1. **Create the GitHub repository**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/CropCanvas.git
git push -u origin main
```

2. **Enable GitHub Pages**
   - Go to repo Settings -> Pages
   - Under Source, select GitHub Actions

3. **Configure Custom Domain**
   - Settings -> Pages -> Custom domain
   - Enter: `cc.trytoinnovate.com`
   - Check Enforce HTTPS

4. **DNS Configuration**

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | cc | `yourusername.github.io` |

### Verifying Deployment

After pushing to `main`:
1. Check the Actions tab for the workflow run
2. Visit `https://cc.trytoinnovate.com`
3. Check Settings -> Pages for status

## Manual Deployment

```bash
npm run build
```

Then deploy `dist/` to any static host:

```bash
# Netlify
npx netlify-cli deploy --dir=dist --prod

# Vercel
npx vercel dist --prod

# Any web server
cp -r dist/* /var/www/html/
```

## Build Output

- Fully static - no server-side code
- `public/CNAME` copied to `dist/` automatically by Vite
- Total size: ~34KB HTML + 28KB CSS + 47KB JS (gzips to ~20KB total)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Custom domain not working | Check DNS records, wait for propagation |
| HTTPS not available | Enable Enforce HTTPS in Pages settings |
| 404 on deploy | Ensure workflow uploads `dist/` |
| Build failing in CI | Check Node version (20+) |
| Missing CNAME after deploy | Ensure `public/CNAME` exists |
