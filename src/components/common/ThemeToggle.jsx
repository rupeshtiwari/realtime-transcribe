import { useThemeMode } from '../../context/ThemeContext';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import { useState } from 'react';

export default function ThemeToggle() {
  const { themeMode, changeTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (mode) => {
    changeTheme(mode);
    handleClose();
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

  return (
    <>
      <Tooltip title="Theme settings">
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 180,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        <MenuItem
          onClick={() => handleSelect('light')}
          selected={themeMode === 'light'}
          sx={{
            borderRadius: '8px',
            mx: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon>
            <Brightness7 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Daylight</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect('dark')}
          selected={themeMode === 'dark'}
          sx={{
            borderRadius: '8px',
            mx: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon>
            <Brightness4 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dim</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect('system')}
          selected={themeMode === 'system'}
          sx={{
            borderRadius: '8px',
            mx: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon>
            <SettingsBrightness fontSize="small" />
          </ListItemIcon>
          <ListItemText>System</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
