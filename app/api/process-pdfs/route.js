import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = [];
    
    // Extract all files from the form data
    for (const entry of formData.entries()) {
      const [name, value] = entry;
      if (name.startsWith('file-') && value instanceof Blob) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No PDF files were provided' },
        { status: 400 }
      );
    }

    // Upload each file to Supabase Storage
    const fileUrls = await Promise.all(
      files.map(async (file, index) => {
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `medical-record-${timestamp}-${index}.pdf`;
        
        // Upload file to Supabase Storage
        const url = await uploadFile(file, filename);
        return url;
      })
    );

    return NextResponse.json({ fileUrls });
  } catch (error) {
    console.error('Error processing PDFs:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF files' },
      { status: 500 }
    );
  }
}