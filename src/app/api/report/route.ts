import { NextRequest, NextResponse } from 'next/server';
import { brevoService } from '@/lib/services/brevo';

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

    // Send email via Brevo
    await brevoService.sendReportEmail({
      name,
      email,
      issueType,
      description,
      details,
      concorsoId,
      concorsoTitle,
      concorsoEnte,
      timestamp,
      issueInfo
    });

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
