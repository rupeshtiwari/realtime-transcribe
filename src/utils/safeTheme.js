import { useTheme as useMUITheme } from '@mui/material/styles';
import { getTheme } from '../theme/theme';

/**
 * Safe wrapper for Material-UI's useTheme hook
 * Ensures a valid theme object is always returned, even if Material-UI's theme is invalid
 */
export function useSafeTheme() {
  let theme;
  try {
    theme = useMUITheme();
    
    // Validate theme is valid
    if (!theme || typeof theme !== 'object' || theme === null || Array.isArray(theme)) {
      console.warn('Invalid theme from useTheme, using fallback');
      return getTheme('light');
    }
    
    // Validate critical properties exist and are objects
    if (!theme.palette || typeof theme.palette !== 'object' || theme.palette === null || Array.isArray(theme.palette)) {
      console.warn('Invalid theme.palette, using fallback');
      return getTheme('light');
    }
    
    // Test Object.values can be called safely
    try {
      Object.values(theme.palette);
    } catch (e) {
      console.error('Theme.palette failed Object.values test:', e);
      return getTheme('light');
    }
    
    return theme;
  } catch (error) {
    console.error('Error accessing theme:', error);
    return getTheme('light');
  }
}
