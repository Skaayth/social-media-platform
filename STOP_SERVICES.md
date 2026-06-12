# How to Stop All Services and Avoid Charges

## 1. Heroku (Backend Hosting)

### Option A: Via Heroku Dashboard (Recommended)
1. Go to https://dashboard.heroku.com
2. Click on your app: `sakethbook-356304ecb26f`
3. Go to **Settings** tab
4. Scroll down to **"Delete app"** section
5. Type the app name: `sakethbook-356304ecb26f`
6. Click **"Delete app"**

### Option B: Via CLI
```bash
heroku apps:destroy sakethbook-356304ecb26f --confirm sakethbook-356304ecb26f
```

**Note:** Heroku free tier is no longer available, so if you're on a paid plan, deleting the app will stop all charges immediately.

---

## 2. Surge (Frontend Hosting)

### Remove Deployment
```bash
npx surge teardown sakethbook.surge.sh
```

Or if you're logged in:
```bash
surge teardown sakethbook.surge.sh
```

### Check All Deployments
```bash
surge list
```

### Remove All Deployments
```bash
surge teardown --domain sakethbook.surge.sh
```

**Note:** Surge is free, but removing deployments ensures no unexpected usage.

---

## 3. MongoDB Atlas (Database)

### Via MongoDB Atlas Dashboard
1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Select your cluster
4. Click **"..."** (three dots) → **"Terminate"** or **"Delete"**
5. Confirm deletion

### Alternative: Pause Cluster (if available)
- Some free tier clusters can be paused instead of deleted
- This stops charges but keeps your data for a limited time

**Note:** MongoDB Atlas free tier (M0) is free, but if you're on a paid tier, deleting the cluster stops charges.

---

## 4. Cloudinary (Image Storage)

### Via Cloudinary Dashboard
1. Go to https://cloudinary.com/console
2. Log in to your account
3. Go to **Settings** → **Account Settings**
4. Scroll to **"Delete Account"** or **"Cancel Subscription"**
5. Follow the prompts

### Alternative: Delete Resources Only
1. Go to **Media Library**
2. Select all assets
3. Delete them
4. This won't delete your account but removes stored images

**Note:** Cloudinary free tier includes 25GB storage. If you're on a paid plan, canceling stops charges.

---

## 5. Google OAuth (No Action Needed)
- Google OAuth is completely free
- No charges or subscriptions
- You can optionally revoke the OAuth app in Google Cloud Console if desired

---

## Quick Checklist

- [ ] Delete Heroku app
- [ ] Remove Surge deployment
- [ ] Delete/pause MongoDB Atlas cluster
- [ ] Cancel Cloudinary account (if on paid plan) or delete resources
- [ ] Verify no active subscriptions in your accounts

---

## Verification

After completing the above steps, verify:
1. Check Heroku dashboard - app should be gone
2. Visit https://sakethbook.surge.sh - should show "project not found"
3. Check MongoDB Atlas - cluster should be deleted
4. Check Cloudinary - account/resources should be removed
5. Review credit card/billing statements for any remaining charges

