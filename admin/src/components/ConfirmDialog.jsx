import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import "./ConfirmDialog.css";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null); // { message, resolve }
  const resolveRef = useRef(null);

  const confirm = useCallback((message, confirmLabel = "Delete") => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message, confirmLabel });
    });
  }, []);

  const handleClose = (result) => {
    setState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={() => handleClose(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => handleClose(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={() => handleClose(true)}>
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
