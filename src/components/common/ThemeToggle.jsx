import { useThemeMode } from '../context/ThemeContext';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
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
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        title="Theme settings"
      >
        {getIcon()}
      </IconButton>
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
      >
        <MenuItem
          onClick={() => handleSelect('light')}
          selected={themeMode === 'light'}
        >
          <ListItemIcon>
            <Brightness7 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Daylight</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect('dark')}
          selected={themeMode === 'dark'}
        >
          <ListItemIcon>
            <Brightness4 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dim</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelect('system')}
          selected={themeMode === 'system'}
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
