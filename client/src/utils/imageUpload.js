import { supabase } from '../lib/supabase';

/**
 * Generates a unique filename to prevent collisions
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename with timestamp
 */
export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Uploads an image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path within bucket (e.g., "sede_id/barbero_id")
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export const uploadImage = async (file, bucket, path) => {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.'
      };
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.name);
    const fullPath = path ? `${path}/${fileName}` : fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: `Error al subir imagen: ${error.message}`
      };
    }

    return {
      success: true,
      path: data.path
    };
  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return {
      success: false,
      error: 'Error inesperado al subir imagen.'
    };
  }
};

/**
 * Deletes an image from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Full path to file in bucket
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (bucket, path) => {
  try {
    if (!path) {
      return { success: true }; // Nothing to delete
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: `Error al eliminar imagen: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting image:', error);
    return {
      success: false,
      error: 'Error inesperado al eliminar imagen.'
    };
  }
};

/**
 * Gets the public URL for an image in Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Full path to file in bucket
 * @returns {string|null} Public URL or null if path is invalid
 */
export const getPublicUrl = (bucket, path) => {
  if (!path) return null;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data?.publicUrl || null;
};

/**
 * Updates an image by deleting the old one and uploading a new one
 * @param {File} newFile - New image file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path within bucket
 * @param {string} oldPath - Path to old image to delete
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export const updateImage = async (newFile, bucket, path, oldPath) => {
  try {
    // Upload new image first
    const uploadResult = await uploadImage(newFile, bucket, path);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old image if it exists
    if (oldPath) {
      await deleteImage(bucket, oldPath);
      // We don't fail the whole operation if deletion fails
    }

    return uploadResult;
  } catch (error) {
    console.error('Unexpected error updating image:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar imagen.'
    };
  }
};

/**
 * Validates if a file is an image
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' };
  }

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.'
    };
  }

  return { valid: true };
};
