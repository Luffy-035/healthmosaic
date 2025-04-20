import { ChatGroq } from "@langchain/groq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import PDFDocument from 'pdfkit';
import jsPDF from "jspdf";

// Initialize the Groq LLM
const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama3-70b-8192",
});

/**
 * Extract text from multiple PDF files
 * @param {string[]} fileUrls - Array of URLs to the PDF files
 * @returns {Promise<string>} The combined extracted text
 */
export async function extractTextFromPdfs(fileUrls) {
    try {
        console.log(`Extracting text from ${fileUrls.length} PDFs`);

        const extractionPromises = fileUrls.map(async (url) => {
            try {
                // Fetch the PDF file
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
                }

                const pdfBlob = await response.blob();

                // Use PDFLoader to extract text
                console.log(`Processing PDF from ${url}`);
                const loader = new PDFLoader(pdfBlob);
                const docs = await loader.load();

                // Combine all pages into one text
                const text = docs.map(doc => doc.pageContent).join('\n\n');
                console.log(`Extracted ${text.length} characters from ${url}`);

                return text;
            } catch (error) {
                console.error(`Error extracting text from ${url}:`, error);
                return `[Error extracting text from ${url}: ${error.message}]`;
            }
        });

        const extractedTexts = await Promise.all(extractionPromises);
        return extractedTexts.join('\n\n==== NEW DOCUMENT ====\n\n');
    } catch (error) {
        console.error('Error in extractTextFromPdfs:', error);
        throw error;
    }
}

/**
 * Generate a summary of medical records using LLM
 * @param {string} text - The text to summarize
 * @returns {Promise<object>} The structured summary
 */
export async function generateSummary(text) {
    try {
        console.log(`Generating summary for ${text.length} characters`);

        // Split text into manageable chunks if it's too large
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 10000,
            chunkOverlap: 1000,
        });

        const chunks = await splitter.createDocuments([text]);
        console.log(`Split text into ${chunks.length} chunks`);

        // Process each chunk and generate summaries
        const chunkSummaries = await Promise.all(
            chunks.map(async (chunk, index) => {
                console.log(`Processing chunk ${index + 1}/${chunks.length}`);

                const result = await model.invoke([
                    ["system", `You are a highly specialized medical AI with expertise in clinical documentation analysis.
Your task is to extract and organize key medical information with precision and clinical accuracy.

Extract the following categories with appropriate medical terminology:
1. Patient demographics (name, DOB, age, gender, MRN, contact information)
2. Medical history (chronological list of conditions with dates of diagnosis when available)
3. Current medications (name, dosage, frequency, route, and purpose)
4. Allergies (allergen, reaction type, severity)
5. Vital signs (with units and reference ranges)
6. Lab results (with values, units, reference ranges, and collection dates)
7. Imaging and diagnostic studies (modality, body part, key findings, date)
8. Clinical assessment and diagnoses (primary and secondary diagnoses with ICD codes if available)
9. Treatment plans (medications, procedures, therapies)
10. Follow-up recommendations (appointments, tests, monitoring parameters)

Use medical standard formatting. For medications, use proper dosing syntax (e.g., "Metformin 500mg BID PO").
For lab values, include units and reference ranges (e.g., "Glucose: 95 mg/dL (70-99)").
For vital signs, use appropriate clinical notation (e.g., "BP: 120/80 mmHg").

Maintain clinical objectivity and factual accuracy. Do not add interpretations beyond what's stated in the source.
If information is missing for any section, note "Not documented" rather than leaving it blank.`],
                    ["user", `Analyze and extract structured medical information from the following clinical documentation:\n\n${chunk.pageContent}`]
                ]);

                return result.content;
            })
        );

        // Combine chunk summaries into a final comprehensive summary
        const combinedSummary = chunkSummaries.join('\n\n');

        // Generate final structured summary
        const finalSummary = await model.invoke([
            ["system", `You are a medical documentation specialist AI that synthesizes clinical information into comprehensive patient summaries.

Your task is to integrate multiple summary fragments from a patient's medical records into one cohesive clinical summary.

Create a structured summary with these precise sections:
1. PATIENT PROFILE: Complete demographics including name, DOB, age, gender, MRN and contact details
2. MEDICAL HISTORY: Comprehensive chronological list of conditions with onset dates and relevant notes
3. MEDICATIONS: Complete medication list with name, dosage, frequency, route, start date, and indication
4. ALLERGIES: All documented allergies with specific reaction types and severity
5. VITAL SIGNS: Most recent measurements with appropriate clinical units and notation
6. LAB RESULTS: Key laboratory findings with values, units, reference ranges, and collection dates
7. DIAGNOSTIC STUDIES: Imaging and other diagnostic results with dates and key findings
8. DIAGNOSES: Primary and secondary diagnoses with ICD codes if available
9. TREATMENT PLAN: Detailed current plan including medications, procedures, and therapies
10. FOLLOW-UP: Specific recommendations including timeframes, provider types, and monitoring parameters

Important guidelines:
- Resolve any contradictions between records by favoring the most recent information
- Remove duplicates while preserving all unique clinical details
- Maintain proper medical terminology and standardized formatting
- Organize information in clinical priority order within each section
- Use "Not documented" for sections without available information

Return the response in this JSON format:
{
  "patientProfile": "",
  "medicalHistory": "",
  "medications": "",
  "allergies": "",
  "vitalSigns": "",
  "labResults": "",
  "diagnosticStudies": "",
  "diagnoses": "",
  "treatmentPlan": "",
  "followUp": ""
}`],
            ["user", `Synthesize the following clinical documentation fragments into a single comprehensive patient summary:\n\n${combinedSummary}`]
        ]);

        // Parse the JSON response
        const summaryContent = finalSummary.content;
        let structuredSummary;

        try {
            // Extract JSON object if it's wrapped in code blocks
            const jsonMatch = summaryContent.match(/```json\n([\s\S]*?)\n```/) ||
                summaryContent.match(/```\n([\s\S]*?)\n```/) ||
                summaryContent.match(/{[\s\S]*?}/);

            const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n/g, '').replace(/```/g, '') : summaryContent;
            structuredSummary = JSON.parse(jsonStr);
            
            // Handle the new diagnosticStudies field or ensure backward compatibility
            if (structuredSummary.diagnosticStudies && !structuredSummary.labResults.includes(structuredSummary.diagnosticStudies)) {
                structuredSummary.labResults = structuredSummary.labResults + "\n\n" + structuredSummary.diagnosticStudies;
            }
            
        } catch (e) {
            console.error('Error parsing summary JSON:', e);
            // Fallback to unstructured text if JSON parsing fails
            structuredSummary = {
                patientProfile: "Error parsing summary data",
                medicalHistory: summaryContent.substring(0, 1000),
                medications: "",
                allergies: "",
                vitalSigns: "",
                labResults: "",
                diagnosis: "",
                treatmentPlan: "",
                followUp: ""
            };
        }

        console.log('Summary generated successfully');
        return structuredSummary;
    } catch (error) {
        console.error('Error in generateSummary:', error);
        throw error;
    }
}

/**
 * Create a PDF document from the generated summary
 * @param {object} summary - The structured summary data
 * @returns {Promise<Buffer>} The PDF document as a buffer
 */
export async function createSummaryPdf(summary) {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
      
      // Set default font
      doc.setFont('helvetica');
      
      // Generate a report ID
      const reportId = `MR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const reportDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      // Extract patient name and basic info from summary
      let patientName = "Unknown Patient";
      let patientAge = "";
      let patientGender = "";
      let patientDOB = "";
      
      if (summary.patientProfile) {
        // Try to extract patient name
        const nameMatch = summary.patientProfile.match(/Name\s*:?\s*([^,\n]*)/i);
        if (nameMatch && nameMatch[1]) patientName = nameMatch[1].trim();
        
        // Try to extract age
        const ageMatch = summary.patientProfile.match(/Age\s*:?\s*(\d+)/i);
        if (ageMatch && ageMatch[1]) patientAge = ageMatch[1].trim() + " Y";
        
        // Try to extract gender
        const genderMatch = summary.patientProfile.match(/(?:gender|sex)\s*:?\s*(male|female|[mf])/i);
        if (genderMatch && genderMatch[1]) {
          patientGender = genderMatch[1].trim().toLowerCase() === 'm' || 
                          genderMatch[1].trim().toLowerCase() === 'male' ? 'Male' : 'Female';
        }
        
        // Try to extract DOB
        const dobMatch = summary.patientProfile.match(/(?:DOB|Date of Birth|Born)\s*:?\s*([^,\n]*\d{4})/i);
        if (dobMatch && dobMatch[1]) patientDOB = dobMatch[1].trim();
      }
      
      // Page width and margins
      const pageWidth = 210;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // ===== HEADER SECTION =====
      // Draw header line
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, 15, pageWidth - margin, 15);
      
     
      // Add report ID
      doc.setFontSize(9);
      doc.text(`${reportId}`, pageWidth - margin, 10, { align: 'right' });
      
      // Add title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICAL SUMMARY REPORT', 105, 25, { align: 'center' });
      
      // Draw header line
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, 30, pageWidth - margin, 30);
      
      // ===== INFORMATION GRID =====
      // Starting position
      let y = 40;
      const rowHeight = 8;
      
      // Column widths for header tables
      const col1Width = contentWidth * 0.33; // Patient information
      const col2Width = contentWidth * 0.33; // Sample information
      const col3Width = contentWidth * 0.34; // Client information
      
      // Draw table borders
      doc.rect(margin, y - rowHeight, col1Width, rowHeight, 'S');
      doc.rect(margin + col1Width, y - rowHeight, col2Width, rowHeight, 'S');
      doc.rect(margin + col1Width + col2Width, y - rowHeight, col3Width, rowHeight, 'S');
      
      // Draw headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - rowHeight, col1Width, rowHeight, 'F');
      doc.rect(margin + col1Width, y - rowHeight, col2Width, rowHeight, 'F');
      doc.rect(margin + col1Width + col2Width, y - rowHeight, col3Width, rowHeight, 'F');
      
      doc.text('Patient Information', margin + 5, y - rowHeight/2 + 2);
      doc.text('Report Information', margin + col1Width + 5, y - rowHeight/2 + 2);
      doc.text('Provider/Location Information', margin + col1Width + col2Width + 5, y - rowHeight/2 + 2);
      
      // Content rows - Patient Information Column
      const patientInfoRows = [
        { label: 'Name', value: patientName },
        { label: 'Sex/Age', value: `${patientGender} / ${patientAge}` },
        { label: 'DOB', value: patientDOB },
        { label: 'Ref. ID', value: `${reportId.replace('MR-', 'P-')}` }
      ];
      
      // Report Information Column
      const reportInfoRows = [
        { label: 'Report ID', value: reportId },
        { label: 'Generated on', value: reportDate },
        { label: 'Processed at', value: new Date().toLocaleTimeString() },
        { label: 'Report Type', value: 'Medical Summary' }
      ];
      
      // Provider Information Column
      const providerInfoRows = [
        { label: 'Generated By', value: 'AI Medical Assistant' },
        { label: 'Facility', value: 'Electronic Health System' },
        { label: 'Status', value: 'For Review' },
        { label: 'Confidential', value: 'CONFIDENTIAL REPORT' }
      ];
      
      // Draw table cells
      const drawInfoCell = (label, value, x, y, width) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.rect(x, y, width, rowHeight, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`${label} :`, x + 3, y + rowHeight/2 + 2);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + 30, y + rowHeight/2 + 2);
      };
      
      // Draw all rows
      for (let i = 0; i < 4; i++) {
        // Draw Patient Info
        drawInfoCell(
          patientInfoRows[i].label, 
          patientInfoRows[i].value, 
          margin, 
          y + (i * rowHeight), 
          col1Width
        );
        
        // Draw Report Info
        drawInfoCell(
          reportInfoRows[i].label, 
          reportInfoRows[i].value, 
          margin + col1Width, 
          y + (i * rowHeight), 
          col2Width
        );
        
        // Draw Provider Info
        drawInfoCell(
          providerInfoRows[i].label, 
          providerInfoRows[i].value, 
          margin + col1Width + col2Width, 
          y + (i * rowHeight), 
          col3Width
        );
      }
      
      // Update y position after info tables
      y += (4 * rowHeight) + 10;
      
      // ===== SUMMARY SECTIONS =====
      // Process and display each section
      const processSection = (title, content, contentType = 'text') => {
        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        // Draw section header
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y + 1, contentWidth, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(title.toUpperCase(), margin + 5, y + 7);
        
        doc.setLineWidth(0.5);
        doc.line(margin, y + 9, pageWidth - margin, y + 9);
        
        // Increase spacing after header to prevent overlap
        y += 15; // Changed from 12 to 15
        
        // If no content, show placeholder
        if (!content || content === "Not documented") {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text("No information available", margin + 5, y + 5);
          y += 10;
          return;
        }
        
        // Handle different content types
        switch(contentType) {
          case 'diagnoses':
            renderDiagnoses(content);
            break;
          case 'medications':
            renderMedicationTable(content);
            break;
          case 'labResults':
            renderLabResults(content);
            break;
          case 'vitals':
            renderVitalsTable(content);
            break;
          default:
            // Default text rendering
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const textLines = doc.splitTextToSize(content, contentWidth - 10);
            textLines.forEach(line => {
              // Check for page overflow
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
              doc.text(line, margin + 5, y);
              y += 5;
            });
            y += 5;
        }
      };
      
      // Render diagnoses as a list with formatted items
      const renderDiagnoses = (content) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const lines = content.split('\n').filter(line => line.trim());
        let itemNum = 1;
        
        // Add a small buffer space at the top
        y += 3;
        
        lines.forEach(line => {
          // Check for page overflow
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          // Add numbered bullet
          doc.setFont('helvetica', 'bold');
          doc.text(`${itemNum}.`, margin + 5, y);
          
          // Add diagnosis text
          doc.setFont('helvetica', 'normal');
          const diagText = doc.splitTextToSize(line, contentWidth - 20);
          diagText.forEach((textLine, i) => {
            doc.text(textLine, margin + 15, y + (i * 5));
            if (i > 0) y += 5;
          });
          
          y += 7;
          itemNum++;
        });
        
        y += 5;
      };
      
      // Render medications as a table
      const renderMedicationTable = (content) => {
        const headers = ["Medication", "Dosage", "Frequency/Instructions"];
        const headerWidths = [contentWidth * 0.35, contentWidth * 0.25, contentWidth * 0.4];
        
        // Extract data for table
        const rows = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (line.includes(":")) {
            const parts = line.split(":");
            const medName = parts[0].trim();
            const details = parts[1].trim();
            
            let dosage = "";
            let frequency = "";
            
            if (details.includes(",")) {
              const detailParts = details.split(",");
              dosage = detailParts[0].trim();
              frequency = detailParts.slice(1).join(",").trim();
            } else {
              // Try to match dosage pattern
              const dosageMatch = details.match(/(\d+\s*(?:mg|mcg|ml|g|tab|cap))/i);
              if (dosageMatch) {
                dosage = dosageMatch[0];
                frequency = details.replace(dosageMatch[0], "").trim();
              } else {
                frequency = details;
              }
            }
            
            rows.push([medName, dosage, frequency]);
          } else {
            // Handle lines without colon separator
            const dosageMatch = line.match(/(\d+\s*(?:mg|mcg|ml|g|tab|cap))/i);
            if (dosageMatch) {
              const parts = line.split(dosageMatch[0]);
              const medName = parts[0].trim();
              const dosage = dosageMatch[0];
              const frequency = parts[1] ? parts[1].trim() : "";
              rows.push([medName, dosage, frequency]);
            } else {
              rows.push([line, "", ""]);
            }
          }
        });
        
        // Draw table
        drawTable(headers, rows, headerWidths);
      };
      
      // Render lab results as a table
      const renderLabResults = (content) => {
        const headers = ["Test", "Result", "Unit", "Reference Range"];
        const headerWidths = [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.15, contentWidth * 0.25];
        
        // Extract data for table
        const rows = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (line.includes(":")) {
            const parts = line.split(":");
            const testName = parts[0].trim();
            const valueStr = parts[1].trim();
            
            let result = "";
            let unit = "";
            let range = "";
            
            // Try to extract numeric result and unit
            const numMatch = valueStr.match(/(\d+\.?\d*)\s*([a-zA-Z%\/]+)?/);
            if (numMatch) {
              result = numMatch[1];
              unit = numMatch[2] || "";
            } else {
              result = valueStr;
            }
            
            // Extract reference range
            if (valueStr.includes("(") && valueStr.includes(")")) {
              const rangeMatch = valueStr.match(/\((.*?)\)/);
              if (rangeMatch) {
                range = rangeMatch[1];
                // Clean up result by removing the range
                result = valueStr.replace(rangeMatch[0], "").trim();
              }
            }
            
            rows.push([testName, result, unit, range]);
          } else {
            // For section headers or notes
            rows.push([line, "", "", ""]);
          }
        });
        
        // Draw table
        drawTable(headers, rows, headerWidths);
      };
      
      // Render vitals as a table
      const renderVitalsTable = (content) => {
        const headers = ["Vital Sign", "Result", "Unit", "Reference Interval"];
        const headerWidths = [contentWidth * 0.3, contentWidth * 0.2, contentWidth * 0.15, contentWidth * 0.35];
        
        // Extract data for table
        const rows = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (line.includes(":")) {
            const parts = line.split(":");
            const vitalName = parts[0].trim();
            const valueStr = parts[1].trim();
            
            let result = valueStr;
            let unit = "";
            let range = "";
            
            // Try to extract numeric result and unit
            const numUnitMatch = valueStr.match(/(\d+\.?\d*)\s*([a-zA-Z%\/]+)?/);
            if (numUnitMatch) {
              result = numUnitMatch[1];
              unit = numUnitMatch[2] || "";
            }
            
            // Extract reference range
            if (valueStr.includes("(") && valueStr.includes(")")) {
              const rangeMatch = valueStr.match(/\((.*?)\)/);
              if (rangeMatch) {
                range = rangeMatch[1];
                // Clean up result
                result = valueStr.replace(rangeMatch[0], "").trim();
                
                // Further cleanup if there's still unit info in result
                const cleanNumMatch = result.match(/(\d+\.?\d*)\s*([a-zA-Z%\/]+)?/);
                if (cleanNumMatch) {
                  result = cleanNumMatch[1];
                  unit = cleanNumMatch[2] || unit;
                }
              }
            }
            
            rows.push([vitalName, result, unit, range]);
          } else {
            rows.push([line, "", "", ""]);
          }
        });
        
        // Draw table
        drawTable(headers, rows, headerWidths);
      };
      
      // General table drawing function
      const drawTable = (headers, rows, columnWidths) => {
        const rowHeight = 8;
        let startY = y;
        
        // Add extra spacing at the start to prevent overlap with header
        startY += 3;
        
        // Draw header row
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, startY, contentWidth, rowHeight, 'F');
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.rect(margin, startY, contentWidth, rowHeight, 'S');
        
        // Draw header cells
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        
        let xPos = margin;
        headers.forEach((header, i) => {
          // Draw cell border
          doc.line(xPos, startY, xPos, startY + rowHeight);
          
          // Draw header text
          doc.text(header, xPos + 3, startY + 5.5);
          xPos += columnWidths[i];
        });
        
        // Draw vertical line at end
        doc.line(margin + contentWidth, startY, margin + contentWidth, startY + rowHeight);
        
        startY += rowHeight;
        
        // Draw data rows
        rows.forEach((row, rowIndex) => {
          // Check for page overflow
          if (startY > 270) {
            doc.addPage();
            startY = 20;
            
            // Redraw header on new page
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, startY, contentWidth, rowHeight, 'F');
            doc.setDrawColor(0);
            doc.rect(margin, startY, contentWidth, rowHeight, 'S');
            
            xPos = margin;
            headers.forEach((header, i) => {
              doc.line(xPos, startY, xPos, startY + rowHeight);
              doc.setFont('helvetica', 'bold');
              doc.text(header, xPos + 3, startY + 5.5);
              xPos += columnWidths[i];
            });
            
            doc.line(margin + contentWidth, startY, margin + contentWidth, startY + rowHeight);
            startY += rowHeight;
          }
          
          // Set alternating row colors
          if (rowIndex % 2 === 1) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, startY, contentWidth, rowHeight, 'F');
          }
          
          // Draw cell borders
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          doc.rect(margin, startY, contentWidth, rowHeight, 'S');
          
          // Draw cell contents
          xPos = margin;
          row.forEach((cell, i) => {
            // Draw cell border
            doc.line(xPos, startY, xPos, startY + rowHeight);
            
            // Draw cell content
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            
            // Special formatting for results (bold if outside normal range)
            if (i === 1 && headers[i] === "Result" && row[3] && row[3] !== "") {
              // Check if result is outside reference range
              const numericResult = parseFloat(cell);
              if (!isNaN(numericResult)) {
                const range = row[3];
                if (range.includes('-')) {
                  const [min, max] = range.split('-').map(v => parseFloat(v.trim()));
                  if (!isNaN(min) && !isNaN(max)) {
                    if (numericResult < min || numericResult > max) {
                      doc.setFont('helvetica', 'bold');
                    }
                  }
                }
              }
            }
            
            const cellText = cell.toString();
            const cellLines = doc.splitTextToSize(cellText, columnWidths[i] - 6);
            const lineCount = cellLines.length;
            
            if (lineCount > 1) {
              // If multiple lines, adjust row height
              const newRowHeight = Math.max(rowHeight, lineCount * 4);
              if (newRowHeight > rowHeight) {
                // Extend this row
                doc.setDrawColor(0);
                doc.setLineWidth(0.1);
                doc.rect(margin, startY, contentWidth, newRowHeight, 'S');
              }
              
              cellLines.forEach((line, lineIndex) => {
                doc.text(line, xPos + 3, startY + 3 + (lineIndex * 4));
              });
            } else {
              doc.text(cellText, xPos + 3, startY + 5.5);
            }
            
            xPos += columnWidths[i];
          });
          
          // Draw vertical line at end
          doc.line(margin + contentWidth, startY, margin + contentWidth, startY + rowHeight);
          
          startY += rowHeight;
        });
        
        // Update y position after table
        y = startY + 5;
      };
      
      // Process each section using appropriate renderer
      processSection('Diagnoses', summary.diagnosis || summary.diagnoses, 'diagnoses');
      processSection('Medications', summary.medications, 'medications');
      processSection('Allergies', summary.allergies);
      processSection('Vital Signs', summary.vitalSigns, 'vitals');
      processSection('Laboratory Results', summary.labResults, 'labResults');
      processSection('Treatment Plan', summary.treatmentPlan);
      processSection('Follow-Up Plan', summary.followUp);
      processSection('Medical History', summary.medicalHistory);
      
      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add footer line
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, 280, pageWidth - margin, 280);
        
        // Add footer text
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('This document contains AI-generated medical information.', 105, 285, { align: 'center' });
        doc.text('Review by a healthcare professional is required before clinical use.', 105, 290, { align: 'center' });
        
        // Add page numbers
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
        
        // Add report ID to footer
        doc.text(`Report ID: ${reportId}`, margin, 285);
      }
      
      // Get the PDF as array buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return pdfBuffer;
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw error;
    }
  }