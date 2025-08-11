import React, { createContext, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [snackPack, setSnackPack] = useState([]);
  const [open, setOpen] = useState(false);
  const [messageInfo, setMessageInfo] = useState(undefined);

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && messageInfo && open) {
      // Close an active snack when a new one is added
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
        sx={{
          '& .MuiSnackbar-root': {
            bottom: { xs: 90, sm: 24 }
          }
        }}
      >
        <Alert
          onClose={handleClose}
          severity={messageInfo?.severity || 'info'}
          variant="filled"
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {messageInfo?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};