/**
 * Supabase Storage integration for file uploads and downloads
 */
import supabase from './supabaseClient';

const BUCKET_NAME = 'medical-pdfs';

/**
 * Upload a file to Supabase Storage
 * @param {Blob} file - The file to upload
 * @param {string} filename - The name to give the file
 * @returns {Promise<string>} The URL of the uploaded file
 */
export async function uploadFile(file, filename) {
  try {
    // Create a unique path for the file
    const path = `${filename}`;
    
    // Convert file to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Uploading file: ${filename} (${buffer.length} bytes)`);
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    
    console.log(`File uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading file ${filename}:`, error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Get a file from Supabase Storage
 * @param {string} filename - The name of the file to retrieve
 * @returns {Promise<Buffer>} The file contents as a Buffer
 */
export async function getFile(filename) {
  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filename);
    
    if (error) {
      throw new Error(`Supabase download error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`File not found: ${filename}`);
    }
    
    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return buffer;
  } catch (error) {
    console.error(`Error retrieving file ${filename}:`, error);
    throw new Error(`Failed to retrieve file: ${error.message}`);
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filename - The name of the file to delete
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export async function deleteFile(filename) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);
    
    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
    
    console.log(`File deleted successfully: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}