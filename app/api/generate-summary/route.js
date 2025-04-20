import { NextResponse } from 'next/server';
import { extractTextFromPdfs, generateSummary,createSummaryPdf } from '@/lib/pdfProcessing';
import { uploadFile } from '@/lib/storage';


export async function POST(request) {
  try {
    const { fileUrls } = await request.json();
    
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return NextResponse.json(
        { error: 'No PDF URLs were provided' },
        { status: 400 }
      );
    }

    // Extract text from all PDFs
    const extractedText = await extractTextFromPdfs(fileUrls);
    
    // Generate a summary of the medical records
    const summary = await generateSummary(extractedText);
    
    // Create a PDF from the summary
    const summaryPdfBuffer = await createSummaryPdf(summary);
    
    // Upload the summary PDF to Railway Storage
    const timestamp = Date.now();
    const filename = `medical-summary-${timestamp}.pdf`;
    const summaryPdfUrl = await uploadFile(
      new Blob([summaryPdfBuffer], { type: 'application/pdf' }),
      filename
    );
    
    return NextResponse.json({ summaryPdfUrl });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}