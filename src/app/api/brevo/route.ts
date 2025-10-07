import { NextRequest, NextResponse } from 'next/server';
import { brevoService } from '@/lib/services/brevo';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { profile, sendWelcomeEmail } = await request.json() as { 
      profile: UserProfile; 
      sendWelcomeEmail?: boolean 
    };

    if (!profile || !profile.email) {
      return NextResponse.json(
        { error: 'Profile with email is required' },
        { status: 400 }
      );
    }

    

    // Create or update contact in Brevo
    const result = await brevoService.createOrUpdateContact(profile);

    // Send welcome email if requested (for new profile completions)
    let welcomeEmailResult = null;
    if (sendWelcomeEmail && profile.firstName) {
      try {
        
        welcomeEmailResult = await brevoService.sendWelcomeEmail(
          profile.email,
          profile.firstName
        );
<<<<<<< Updated upstream
        console.log('Welcome email sent successfully');
      } catch (emailError: unknown) {
=======
        
      } catch (emailError: any) {
>>>>>>> Stashed changes
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the entire operation if welcome email fails
        welcomeEmailResult = { error: emailError instanceof Error ? emailError.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile synchronized with Brevo successfully',
      data: {
        brevoSync: result,
        welcomeEmail: welcomeEmailResult
      }
    });

  } catch (error: unknown) {
    console.error('Brevo API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync profile with Brevo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { profile } = await request.json() as { profile: UserProfile };

    if (!profile || !profile.email) {
      return NextResponse.json(
        { error: 'Profile with email is required' },
        { status: 400 }
      );
    }

    

    // Update existing contact in Brevo
    const result = await brevoService.updateContact(profile);

    return NextResponse.json({
      success: true,
      message: 'Profile updated in Brevo successfully',
      data: result
    });

  } catch (error: unknown) {
    console.error('Brevo API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update profile in Brevo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    

    // Delete contact from Brevo
    const result = await brevoService.deleteContact(email);

    return NextResponse.json({
      success: true,
      message: 'Contact deleted from Brevo successfully',
      data: result
    });

  } catch (error: unknown) {
    console.error('Brevo API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete contact from Brevo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 