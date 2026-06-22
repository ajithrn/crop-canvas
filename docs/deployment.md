# Deployment Guide

## GitHub Pages (Automated)

CropCanvas deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

### How It Works

The workflow at `.github/workflows/deploy.yml`:
1. Checks out the repository
2. Copies the `CNAME` file into `app/` for custom domain support
3. Uploads the `app/` directory as a Pages artifact
4. Deploys to GitHub Pages

### Initial Setup

1. **Create the GitHub repository**

```bash
cd CropCanvas
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/CropCanvas.git
git push -u origin main
```

2. **Enable GitHub Pages**
   - Go to repo **Settings → Pages**
   - Under **Source**, select **GitHub Actions**
   - The workflow will handle the rest

3. **Configure Custom Domain**
   - Go to repo **Settings → Pages → Custom domain**
   - Enter: `cc.trytoinnovate.com`
   - Check **Enforce HTTPS**

4. **DNS Configuration**

   Add these DNS records in your domain registrar for `trytoinnovate.com`:

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | cc | `yourusername.github.io` |

   Or if using apex domain, add A records:

   | Type | Name | Value |
   |------|------|-------|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |

5. **Wait for propagation** — DNS changes can take up to 48 hours

### Verifying Deployment

After pushing to `main`:
1. Go to **Actions** tab in GitHub to see the workflow run
2. Once complete, visit `https://cc.trytoinnovate.com`
3. Check **Settings → Pages** for deployment status

## Manual Deployment

Since CropCanvas has no build step, you can host the `app/` directory on any static hosting:

```bash
# Netlify
npx netlify-cli deploy --dir=app --prod

# Vercel
npx vercel app --prod

# Cloudflare Pages
# Point to the app/ directory in dashboard settings

# Any web server
cp -r app/* /var/www/html/
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Custom domain not working | Check DNS records, wait for propagation |
| HTTPS not available | Enable "Enforce HTTPS" in Pages settings |
| 404 on deploy | Ensure `app/index.html` exists |
| Workflow failing | Check Actions tab for error logs |
| CNAME reset | The workflow copies CNAME into app/ automatically |
