# Email Template Setup Guide

Complete guide to setting up custom email templates for Quiet Network in Supabase.

## Quick Start

1. Preview the email design by opening `confirm-signup-preview.html` in your browser
2. Follow the setup steps below to configure Supabase
3. Test by signing up a new user

---

## Step 1: Enable Email Confirmations

First, make sure email confirmations are enabled in Supabase:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Email** provider
5. Make sure **Enable Email Confirmations** is toggled ON
6. Set **Confirm email** toggle to ON if you want users to confirm before accessing the app
7. Click **Save**

---

## Step 2: Configure Email Templates

### Confirm Signup Email

1. Go to **Authentication** > **Email Templates**
2. Click on **Confirm signup** template
3. Open `confirm-signup.html` from this directory
4. Copy the entire HTML content
5. Paste it into the **Message Body** field in Supabase
6. Set **Subject** to:
   ```
   Confirm your email for Quiet Network
   ```
7. Click **Save**

### Reset Password Email

1. While still in **Email Templates**, click on **Reset Password**
2. Open `reset-password.html` from this directory
3. Copy the entire HTML content
4. Paste it into the **Message Body** field
5. Set **Subject** to:
   ```
   Reset your password - Quiet Network
   ```
6. Click **Save**

### Magic Link Email (Optional)

If you plan to use passwordless authentication:

1. Click on **Magic Link** template
2. Open `magic-link.html` from this directory
3. Copy the entire HTML content
4. Paste it into the **Message Body** field
5. Set **Subject** to:
   ```
   Your magic link for Quiet Network
   ```
6. Click **Save**

---

## Step 3: Configure Site URL (Important!)

For email confirmation links to work correctly:

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://quiet-network.vercel.app`)
3. Add **Redirect URLs** if you have multiple domains or staging environments
4. Click **Save**

---

## Step 4: Configure Redirect URLs

After email confirmation, users will be redirected. Make sure your redirect URL is configured:

1. In **URL Configuration**, add your app's domain to **Redirect URLs**
2. For local development, add: `http://localhost:5173`
3. For production, add: `https://your-domain.com`

---

## Step 5: Test the Email Flow

### Testing in Development

1. Make sure your app is running locally
2. Sign up with a new email address
3. Check the email inbox:
   - **If using Supabase local**: Open http://localhost:54324 (Inbucket)
   - **If using cloud Supabase**: Check the actual email inbox
4. Click the confirmation link
5. Verify you're redirected back to the app

### Testing in Production

1. Deploy your changes
2. Sign up with a real email address
3. Check your inbox for the styled confirmation email
4. Click the confirmation link
5. Verify you're redirected to the app and can sign in

---

## Troubleshooting

### Email not arriving

1. Check your Supabase project's **Authentication** > **Settings**
2. Verify SMTP settings are configured (if using custom SMTP)
3. Check spam/junk folder
4. For development: Check Inbucket at http://localhost:54324

### Confirmation link not working

1. Verify **Site URL** is set correctly in **URL Configuration**
2. Check that redirect URLs include your domain
3. Make sure the link hasn't expired (default: 24 hours for signup, 1 hour for password reset)

### Email template not updating

1. After saving, wait a few seconds
2. Try signing up with a new email to see the updated template
3. Clear browser cache if previewing
4. Check that you copied the entire HTML content including DOCTYPE

### Styling looks broken

1. Email clients have limited CSS support - the templates use inline styles for maximum compatibility
2. Test in multiple email clients (Gmail, Outlook, Apple Mail)
3. Use the preview file (`confirm-signup-preview.html`) to debug locally

---

## Customization

### Changing Colors

To match future brand updates, edit these inline styles in the HTML files:

- Background: `#F8FAFC`
- Primary text: `#475569`
- Secondary text: `#94A3B8`
- Borders: `#E2E8F0`
- Button color: `#64748B`

### Changing Copy

Edit the text content in the HTML files directly. Keep messages concise and friendly.

### Adding a Logo

To add your logo:

1. Upload logo to a public CDN or Supabase Storage
2. Add an `<img>` tag in the header section:
   ```html
   <img src="https://your-cdn.com/logo.png" alt="Quiet Network" width="120" style="display: block; margin-bottom: 16px;">
   ```

---

## Next Steps

- [ ] Set up SMTP settings for production email delivery
- [ ] Test email flow in all environments (local, staging, production)
- [ ] Consider adding **Invite** email template if you plan to add invite functionality
- [ ] Set up email rate limiting in Supabase settings to prevent abuse

---

## Resources

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Client CSS Support](https://www.caniemail.com/)
- [Supabase Auth Settings](https://supabase.com/docs/guides/auth)
