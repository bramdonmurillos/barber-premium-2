import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage, getPublicUrl, validateImageFile } from '../../utils/imageUpload'

/**
 * ImageUpload Component
 * Reusable component for uploading images to Supabase Storage
 * 
 * @param {string} bucket - Supabase Storage bucket name
 * @param {string} path - Path within bucket for organizing files
 * @param {function} onUploadComplete - Callback when upload completes: (storagePath) => void
 * @param {function} onDelete - Optional callback when image is deleted: () => void
 * @param {string} existingUrl - Optional existing image URL to display
 * @param {string} existingPath - Optional existing storage path (for deletion)
 * @param {number} maxSizeMB - Optional max file size in MB (default: 5)
 * @param {string} label - Optional label text
 */
export default function ImageUpload({ 
  bucket, 
  path = '', 
  // Acepta ambas variantes de nombre para compatibilidad
  onUploadComplete,
  onUpload,
  onDelete,
  existingUrl = null,
  currentImageUrl = null,
  existingPath = null,
  currentStoragePath = null,
  maxSizeMB = 5,
  label = 'Imagen',
  disabled = false
}) {
  // Normalizar props para soportar ambas convenciones
  const resolvedExistingUrl = existingUrl || currentImageUrl;
  const resolvedExistingPath = existingPath || currentStoragePath;
  const resolvedOnUpload = onUploadComplete || onUpload;

  const [preview, setPreview] = useState(resolvedExistingUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handles file selection (from input or drag-drop)
   */
  const handleFile = async (file) => {
    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    const result = await uploadImage(file, bucket, path);
    setUploading(false);

    if (!result.success) {
      setError(result.error);
      setPreview(resolvedExistingUrl); // Revert preview on error
      return;
    }

    // Get public URL to pass back to parent
    const publicUrl = getPublicUrl(bucket, result.path);

    // Notify parent component with both publicUrl and storagePath
    if (resolvedOnUpload) {
      resolvedOnUpload(publicUrl, result.path);
    }
  };

  /**
   * Handles file input change
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Handles drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handles drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Handles image deletion
   */
  const handleDelete = async () => {
    if (!resolvedExistingPath) {
      setPreview(null);
      if (onDelete) onDelete();
      return;
    }

    setUploading(true);
    const result = await deleteImage(bucket, resolvedExistingPath);
    setUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPreview(null);
    if (onDelete) onDelete();
  };

  /**
   * Opens file picker
   */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Upload Area */}
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive ? 'border-gold bg-gold/10' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!uploading && !disabled ? openFilePicker : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading || disabled}
          />

          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-gold animate-spin mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
            )}
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              {uploading ? 'Subiendo imagen...' : 'Haz clic o arrastra una imagen aquí'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              JPEG, PNG, WebP, GIF - Máx. {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        /* Preview Area */
        <div className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading || disabled}
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-600 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading || disabled}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Eliminar
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Help Text */}
      {!error && !preview && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          La imagen se subirá automáticamente al seleccionarla
        </p>
      )}
    </div>
  );
}
