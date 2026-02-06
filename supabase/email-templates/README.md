# Email Templates for Quiet Network

This directory contains custom email templates for Supabase authentication emails.

## Templates

- `confirm-signup.html` - Email confirmation template sent when users sign up
- `reset-password.html` - Password reset template sent when users request to reset their password
- `magic-link.html` - Magic link template for passwordless sign-in
- `confirm-signup-preview.html` - Preview version of the signup email (open in browser)

## Color Palette

The templates use the Quiet Network color scheme:

- **Slate** (`#475569`) - Primary text
- **Off-white** (`#F8FAFC`) - Background
- **Muted** (`#94A3B8`) - Secondary text
- **Border** (`#E2E8F0`) - Borders and dividers
- **Accent** (`#64748B`) - Buttons and links

## Setting up in Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **Authentication** > **Email Templates**

#### Confirm Signup Template

3. Select **Confirm signup** template
4. Copy the contents of `confirm-signup.html` and paste it into the template editor
5. Set the **Subject line** to: `Confirm your email for Quiet Network`
6. Click **Save**

#### Password Reset Template

7. Select **Reset Password** template
8. Copy the contents of `reset-password.html` and paste it into the template editor
9. Set the **Subject line** to: `Reset your password - Quiet Network`
10. Click **Save**

#### Magic Link Template (Optional)

11. Select **Magic Link** template
12. Copy the contents of `magic-link.html` and paste it into the template editor
13. Set the **Subject line** to: `Your magic link for Quiet Network`
14. Click **Save**

### Option 2: Via Supabase CLI

If you're using Supabase locally or want to version control your email templates:

1. Make sure you have the Supabase CLI installed
2. Create or update your `supabase/config.toml` file:

```toml
[auth.email.template.confirmation]
subject = "Confirm your email for Quiet Network"
content_path = "./supabase/email-templates/confirm-signup.html"
```

3. Run `supabase db push` to apply the changes

## Template Variables

Supabase provides these variables for email templates:

- `{{ .ConfirmationURL }}` - The confirmation link (required)
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - The hashed token
- `{{ .SiteURL }}` - Your site URL from Supabase settings
- `{{ .Email }}` - The user's email address

## Testing

To test the email template:

1. Make sure email confirmation is enabled in Supabase:
   - Go to **Authentication** > **Settings**
   - Under **Email Auth**, make sure **Enable Email Confirmations** is checked
2. Sign up a new user in your app
3. Check the email inbox (or Supabase logs in development)

## Development Notes

- In local development, emails are captured by Supabase's [Inbucket](https://inbucket.org/) service
- Access local emails at `http://localhost:54324` (default Supabase local setup)
- Make sure your Supabase project has email settings configured in **Settings** > **Authentication** > **SMTP Settings**
