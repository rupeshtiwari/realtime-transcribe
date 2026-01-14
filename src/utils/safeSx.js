/**
 * Safe sx prop validator for Material-UI
 * Ensures all values in sx prop are valid and won't cause Object.values() errors
 */
export function safeSx(sx) {
  if (!sx || typeof sx !== 'object' || sx === null || Array.isArray(sx)) {
    return {};
  }
  
  // Recursively clean sx object to ensure no undefined/null values
  const cleaned = {};
  
  for (const [key, value] of Object.entries(sx)) {
    // Skip undefined/null values
    if (value === undefined || value === null) {
      continue;
    }
    
    // If value is an object (nested sx), recurse
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const cleanedNested = safeSx(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      // Primitive value, keep it
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}
