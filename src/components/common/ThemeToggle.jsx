import { useThemeMode } from '../../context/ThemeContext';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import { useState } from 'react';

export default function ThemeToggle() {
  const { themeMode, changeTheme, actualMode } = useThemeMode();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    // Cycle through themes: light -> dark -> system
    if (themeMode === 'light') {
      changeTheme('dark');
    } else if (themeMode === 'dark') {
      changeTheme('system');
    } else {
      changeTheme('light');
    }
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'dark':
        return <Brightness4 />;
      case 'light':
        return <Brightness7 />;
      default:
        return <SettingsBrightness />;
    }
  };

  const getTooltip = () => {
    switch (themeMode) {
      case 'dark':
        return 'Dark mode (click to switch to System)';
      case 'light':
        return 'Light mode (click to switch to Dark)';
      default:
        return 'System mode (click to switch to Light)';
    }
  };

  return (
    <Tooltip title={getTooltip()} arrow placement="bottom">
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'text.primary',
          backgroundColor: actualMode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(99, 102, 241, 0.1)',
          border: `1px solid ${actualMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.2)'}`,
          borderRadius: '12px',
          padding: '10px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: actualMode === 'dark' 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(99, 102, 241, 0.15)',
            transform: 'scale(1.05)',
            boxShadow: actualMode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(99, 102, 241, 0.2)',
          },
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
}
