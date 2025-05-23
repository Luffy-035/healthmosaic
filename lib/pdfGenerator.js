/**
 * A simplified PDF generator that doesn't rely on external fonts
 */

/**
 * Generate a summary PDF as a string in base64 format
 * @param {object} summary - The structured summary data
 * @returns {string} - Base64 encoded PDF
 */
export function generatePdfAsBase64(summary) {
    // Create a simple HTML structure for the PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Medical Summary</title>
        <style>
          body { font-family: sans-serif; margin: 40px; }
          h1 { text-align: center; color: #2c3e50; }
          .timestamp { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
          h2 { color: #3498db; margin-top: 20px; }
          .section { margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 40px; color: #7f8c8d; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Medical Records Summary</h1>
        <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        
        <div class="section">
          <h2>Patient Profile</h2>
          <p>${summary.patientProfile || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Medical History</h2>
          <p>${summary.medicalHistory || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Medications</h2>
          <p>${summary.medications || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Allergies</h2>
          <p>${summary.allergies || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Vital Signs</h2>
          <p>${summary.vitalSigns || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Lab Results</h2>
          <p>${summary.labResults || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Diagnosis</h2>
          <p>${summary.diagnosis || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Treatment Plan</h2>
          <p>${summary.treatmentPlan || "No information provided."}</p>
        </div>
        
        <div class="section">
          <h2>Follow-Up</h2>
          <p>${summary.followUp || "No information provided."}</p>
        </div>
        
        <div class="footer">
          This summary was generated by AI and should be reviewed by a healthcare professional.
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to base64
    const base64 = Buffer.from(html).toString('base64');
    return base64;
  }
  
  /**
   * Create a simple text summary instead of a PDF
   * @param {object} summary - The structured summary data
   * @returns {string} - Plain text summary
   */
  export function generateTextSummary(summary) {
    const text = `
  MEDICAL RECORDS SUMMARY
  Generated on: ${new Date().toLocaleString()}
  
  PATIENT PROFILE
  ${summary.patientProfile || "No information provided."}
  
  MEDICAL HISTORY
  ${summary.medicalHistory || "No information provided."}
  
  MEDICATIONS
  ${summary.medications || "No information provided."}
  
  ALLERGIES
  ${summary.allergies || "No information provided."}
  
  VITAL SIGNS
  ${summary.vitalSigns || "No information provided."}
  
  LAB RESULTS
  ${summary.labResults || "No information provided."}
  
  DIAGNOSIS
  ${summary.diagnosis || "No information provided."}
  
  TREATMENT PLAN
  ${summary.treatmentPlan || "No information provided."}
  
  FOLLOW-UP
  ${summary.followUp || "No information provided."}
  
  This summary was generated by AI and should be reviewed by a healthcare professional.
    `;
    
    return text;
  }