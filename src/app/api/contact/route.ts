import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400 }
      );
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      
      return NextResponse.json(
        { message: 'Messaggio ricevuto! Ti contatteremo presto.' },
        { status: 200 }
      );
    }

    // Create transporter with secure SMTP settings for Google Workspace
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Define email content
    const mailOptions = {
      from: {
        name: 'Concoro Contact Form',
        address: process.env.SMTP_EMAIL
      },
      to: 'info@concoro.it',
      replyTo: email,
      subject: `Nuovo messaggio dal sito - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0A1F44; border-bottom: 2px solid #0A1F44; padding-bottom: 10px;">
            Nuovo messaggio dal sito Concoro
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0A1F44; margin-top: 0;">Dettagli del contatto:</h3>
            <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Oggetto:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #0A1F44; margin-top: 0;">Messaggio:</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Questo messaggio è stato inviato dal modulo di contatto del sito web Concoro.
              Per rispondere, utilizza l'indirizzo email: ${email}
            </p>
          </div>
        </div>
      `,
      text: `
        Nuovo messaggio dal sito Concoro
        
        Nome: ${firstName} ${lastName}
        Email: ${email}
        Oggetto: ${subject}
        
        Messaggio:
        ${message}
        
        ---
        Questo messaggio è stato inviato dal modulo di contatto del sito web Concoro.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Messaggio inviato con successo!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'invio del messaggio. Riprova più tardi.' },
      { status: 500 }
    );
  }
} 