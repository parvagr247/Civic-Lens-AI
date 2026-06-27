/**
 * Service providing client-side image validations and helpers.
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;

/**
 * Validates selected file parameters prior to uploading.
 *
 * @param {File} file Selected file object.
 * @returns {Object} Validation outcome containing { valid: boolean, error: string|null }.
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'An image file must be selected.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Unsupported format. Please select a JPG, JPEG, PNG, or WEBP image.' 
    };
  }

  const fileSizeMb = file.size / (1024 * 1024);
  if (fileSizeMb > MAX_FILE_SIZE_MB) {
    return { 
      valid: false, 
      error: `File size (${fileSizeMb.toFixed(1)}MB) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.` 
    };
  }

  return { valid: true, error: null };
};
