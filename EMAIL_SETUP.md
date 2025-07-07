# 📧 Contact Form Email Setup Instructions

The contact form has been fully implemented and is ready to send emails. Follow these steps to enable email functionality:

## 🔧 Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```env
SMTP_EMAIL=your-gmail-address@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📋 Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password as `SMTP_PASSWORD`

## 🔄 Alternative Email Services

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_EMAIL=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_EMAIL=your-mailgun-email
SMTP_PASSWORD=your-mailgun-password
```

## 📝 Current Form Fields

The contact form collects:
- **Nome** (First Name) - Required
- **Cognome** (Last Name) - Required  
- **Email** - Required with validation
- **Oggetto** (Subject) - Required
- **Messaggio** (Message) - Required

## 📧 Email Template

Emails are sent to `info@concoro.it` with:
- **Subject**: "Nuovo messaggio dal sito - [Subject]"
- **HTML formatted** with Concoro branding
- **Sender details** clearly displayed
- **Reply-to** functionality

## 🧪 Testing

1. **Without SMTP setup**: Form submissions log to console and show success message
2. **With SMTP setup**: Actual emails are sent to info@concoro.it
3. **API testing**: `POST /api/contact` with form data

## 🚀 Production Deployment

For production, ensure:
- Environment variables are set in your hosting platform
- SMTP credentials are kept secure
- Rate limiting is considered for the contact endpoint
- Email deliverability is monitored

## 🎨 Features

✅ **Form Validation** - Client and server-side validation  
✅ **Loading States** - Shows "Invio in corso..." during submission  
✅ **Success/Error Messages** - User-friendly feedback  
✅ **Responsive Design** - Works on all devices  
✅ **Accessibility** - Proper labels and semantic HTML  
✅ **Brand Consistency** - Uses Concoro colors and styling  

The form is fully functional and ready for production use! 