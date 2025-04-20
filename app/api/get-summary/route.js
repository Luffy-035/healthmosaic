import { NextResponse } from 'next/server';
import { getFile } from '@/lib/storage';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'No filename provided' },
        { status: 400 }
      );
    }

    const fileBuffer = await getFile(filename);
    
    // Return the PDF file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error retrieving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve PDF' },
      { status: 500 }
    );
  }
}