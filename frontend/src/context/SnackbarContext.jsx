// src/context/SnackbarContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';

// Create context
const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [snackPack, setSnackPack] = useState([]);
  const [open, setOpen] = useState(false);
  const [messageInfo, setMessageInfo] = useState(undefined);

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      setMessageInfo({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && messageInfo && open) {
      setOpen(false);
    }
  }, [snackPack, messageInfo, open]);

  const showSnackbar = (message, severity = 'success', duration = 6000) => {
    setSnackPack((prev) => [
      ...prev,
      {
        message,
        severity,
        key: Date.now(),
        duration
      }
    ]);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    setMessageInfo(undefined);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        key={messageInfo?.key}
        open={open}
        autoHideDuration={messageInfo?.duration}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={messageInfo?.severity || 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {messageInfo?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Create and export the custom hook
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
