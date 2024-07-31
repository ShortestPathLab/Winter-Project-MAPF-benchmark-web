import { CloseOutlined as CloseIcon } from "@mui/icons-material";
import { Button, IconButton, Snackbar } from "@mui/material";
import { filter, noop } from "lodash";
import { Label } from "./Label";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import React from "react";

type A = (
  message?: string,
  secondary?: string,
  options?: {
    error?: boolean;
    action?: () => void;
    actionLabel?: string;
  }
) => () => void;

const SnackbarContext = createContext<A>(() => noop);

export interface SnackbarMessage {
  message?: ReactNode;
  action?: () => void;
  actionLabel?: ReactNode;
  key: number;
}

export interface State {
  open: boolean;
  snackPack: readonly SnackbarMessage[];
  messageInfo?: SnackbarMessage;
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function useSnackbarAction<T extends []>() {
  const push = useSnackbar();
  return (
      f: (...args: T) => Promise<any>,
      { start = "Preparing...", end = "Done" }: { start?: string; end?: string }
    ) =>
    async (...params: T) => {
      if (start) push(start);
      await f(...params);
      if (end) push(end);
    };
}

export function SnackbarProvider({ children }: { children?: ReactNode }) {
  const [snackPack, setSnackPack] = useState<readonly SnackbarMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SnackbarMessage | undefined>(
    undefined
  );

  useEffect(() => {
    if (snackPack.length && !current) {
      setCurrent({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && current && open) {
      setOpen(false);
    }
  }, [snackPack, current, open]);

  const handleMessage = useCallback(
    ((message?: string, secondary?: string, options = {}) => {
      setSnackPack((prev) => [
        ...prev,
        {
          message: <Label primary={message} secondary={secondary} />,
          action: options.action,
          actionLabel: options.actionLabel,
          key: new Date().getTime(),
        },
      ]);

      if (options.error) {
        console.error(`${message}, ${secondary}`);
      }
      return () => handleClose("");
    }) as A,
    [setSnackPack]
  );

  const handleClose = (_: any, reason?: string) => {
    reason !== "clickaway" && setOpen(false);
  };

  const handleExited = () => setCurrent(undefined);

  return (
    <>
      <SnackbarContext.Provider value={handleMessage}>
        {children}
      </SnackbarContext.Provider>
      <Snackbar
        sx={{
          "> .MuiPaper-root": {
            bgcolor: "background.paper",
            color: "text.primary",
          },
        }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        key={current?.key}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
        message={current?.message}
        action={
          <>
            {current?.action && (
              <Button
                variant="text"
                onClick={(e) => {
                  current?.action?.();
                  handleClose?.(e);
                }}
                color="primary"
              >
                {current?.actionLabel}
              </Button>
            )}
            <IconButton
              aria-label="close"
              color="inherit"
              sx={{ p: 0.5 }}
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </>
        }
      />
    </>
  );
}
