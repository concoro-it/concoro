import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      issueType, 
      description, 
      details, 
      concorsoId, 
      concorsoTitle, 
      concorsoEnte, 
      timestamp 
    } = body;

    // Validate required fields
    if (!issueType || !description || !concorsoId || !concorsoTitle) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      );
    }

    // Map issue types to Italian labels and categorization tags
    const issueTypeMap: { [key: string]: { label: string; tag: string; priority: string } } = {
      'informazioni-errate': { 
        label: 'Informazioni errate', 
        tag: 'DATA_ERROR', 
        priority: 'MEDIUM' 
      },
      'bando-scaduto': { 
        label: 'Bando scaduto', 
        tag: 'EXPIRED_LISTING', 
        priority: 'HIGH' 
      },
      'link-non-funzionante': { 
        label: 'Link non funzionante', 
        tag: 'BROKEN_LINK', 
        priority: 'MEDIUM' 
      },
      'contenuto-inappropriato': { 
        label: 'Contenuto inappropriato', 
        tag: 'INAPPROPRIATE_CONTENT', 
        priority: 'HIGH' 
      },
      'altro': { 
        label: 'Altro problema', 
        tag: 'OTHER_ISSUE', 
        priority: 'LOW' 
      }
    };

    const issueInfo = issueTypeMap[issueType] || issueTypeMap['altro'];

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log('SMTP credentials not configured. Report would be sent with these details:', {
        name, email, issueType: issueInfo.label, description, details, 
        concorsoId, concorsoTitle, concorsoEnte, tag: issueInfo.tag, priority: issueInfo.priority
      });
      return NextResponse.json(
        { message: 'Segnalazione ricevuta! Verificheremo il problema al più presto.' },
        { status: 200 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Format the email content with proper categorization
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: 'info@concoro.it',
      subject: `[${issueInfo.tag}] [${issueInfo.priority}] Segnalazione: ${issueInfo.label} - ${concorsoTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A1F44 0%, #1a365d 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px; display: flex; align-items: center;">
              🚩 Nuova Segnalazione Concorso
            </h1>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
              <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                ${issueInfo.tag}
              </span>
              <span style="background: ${issueInfo.priority === 'HIGH' ? '#dc2626' : issueInfo.priority === 'MEDIUM' ? '#d97706' : '#6b7280'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                PRIORITÀ ${issueInfo.priority}
              </span>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #0A1F44;">
            <h2 style="color: #0A1F44; margin-top: 0; font-size: 18px;">📋 Dettagli del Concorso Segnalato</h2>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
              <p style="margin: 0;"><strong>ID Concorso:</strong> ${concorsoId}</p>
              <p style="margin: 5px 0;"><strong>Titolo:</strong> ${concorsoTitle}</p>
              <p style="margin: 5px 0 0 0;"><strong>Ente:</strong> ${concorsoEnte}</p>
            </div>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef;">
            <h2 style="color: #0A1F44; margin-top: 0; font-size: 18px;">⚠️ Problema Segnalato</h2>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="margin: 0;"><strong>Tipo di Problema:</strong> ${issueInfo.label}</p>
              <p style="margin: 10px 0 0 0;"><strong>Tag Categorizzazione:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${issueInfo.tag}</code></p>
            </div>
            
            <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px;">
              <h3 style="color: #0A1F44; margin-top: 0; font-size: 16px;">Descrizione del Problema:</h3>
              <p style="line-height: 1.6; white-space: pre-wrap; margin: 0;">${description}</p>
            </div>
            
            ${details ? `
              <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-top: 15px;">
                <h3 style="color: #0A1F44; margin-top: 0; font-size: 16px;">Dettagli Aggiuntivi:</h3>
                <p style="line-height: 1.6; white-space: pre-wrap; margin: 0;">${details}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; border-top: 0;">
            <h2 style="color: #0A1F44; margin-top: 0; font-size: 18px;">👤 Informazioni Reporter</h2>
            <div style="background: white; padding: 15px; border-radius: 6px;">
              <p style="margin: 0;"><strong>Nome:</strong> ${name || 'Non fornito'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email || 'Non fornita'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Data Segnalazione:</strong> ${new Date(timestamp).toLocaleString('it-IT', {
                timeZone: 'Europe/Rome',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; font-size: 14px; color: #1565c0;">
              💡 <strong>Azione Suggerita:</strong> Verifica il concorso con ID <code>${concorsoId}</code> 
              ${email ? `e rispondi a ${email} una volta risolto il problema.` : 'nel sistema.'}
            </p>
          </div>
        </div>
      `,
      // Also include a plain text version
      text: `
        NUOVA SEGNALAZIONE CONCORSO
        Tag: ${issueInfo.tag} | Priorità: ${issueInfo.priority}
        
        DETTAGLI CONCORSO:
        - ID: ${concorsoId}
        - Titolo: ${concorsoTitle}
        - Ente: ${concorsoEnte}
        
        PROBLEMA SEGNALATO:
        - Tipo: ${issueInfo.label}
        - Tag Categorizzazione: ${issueInfo.tag}
        
        Descrizione:
        ${description}
        
        ${details ? `Dettagli Aggiuntivi:\n${details}\n` : ''}
        
        INFORMAZIONI REPORTER:
        - Nome: ${name || 'Non fornito'}
        - Email: ${email || 'Non fornita'}
        - Data: ${new Date(timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
        
        ---
        Questa segnalazione è stata inviata dal sistema di report del sito Concoro.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Segnalazione inviata con successo! Verificheremo il problema al più presto.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending report email:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'invio della segnalazione. Riprova più tardi.' },
      { status: 500 }
    );
  }
} 