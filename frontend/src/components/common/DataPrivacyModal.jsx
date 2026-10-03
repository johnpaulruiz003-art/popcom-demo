import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import '../../styles/dataPrivacy.css';

const STORAGE_KEY = 'dataPrivacyAck';

/**
 * Reads the stored acknowledgment.
 * Accepts either the JSON record written by this component or a plain
 * 'true' string, so the check stays correct if the value is edited by hand.
 */
export function hasAcknowledgedDataPrivacy() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return false;
    if (raw === 'true') return true;
    const parsed = JSON.parse(raw);
    return parsed?.acknowledged === true || parsed === true;
  } catch {
    return false;
  }
}

/**
 * Persists the acknowledgment. Wrapped in try/catch so that when storage is
 * unavailable (private mode, blocked cookies) the modal still closes and
 * simply reappears on the next visit.
 */
function saveAcknowledgment() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ acknowledged: true, acknowledgedAt: new Date().toISOString() })
    );
  } catch {
    /* storage unavailable - session-only acknowledgement */
  }
}

/** Clears the stored acknowledgment so the notice can be shown again. */
export function clearDataPrivacyAcknowledgment() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Event used by the footer "Privacy settings" link to reopen the notice. */
export const DATA_PRIVACY_OPEN_EVENT = 'data-privacy:open';

/** Clears the stored acknowledgment and asks the mounted modal to reopen. */
export function reopenDataPrivacyNotice() {
  clearDataPrivacyAcknowledgment();
  window.dispatchEvent(new Event(DATA_PRIVACY_OPEN_EVENT));
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DataPrivacyModal({ opened, onClose, onAcknowledge }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const navigate = useNavigate();

  // Move focus into the dialog, lock background scroll, and restore
  // focus to whatever was focused before the modal opened.
  useEffect(() => {
    if (!opened) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const node = dialogRef.current;
    if (node) {
      const first = node.querySelector(FOCUSABLE);
      (first || node).focus();
    }

    return () => {
      document.body.style.overflow = overflow;
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [opened]);

  // Keep Tab cycling inside the dialog.
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      // Session-only dismissal: close without saving so it returns
      // on the next page load.
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== 'Tab') return;

    const node = dialogRef.current;
    if (!node) return;
    const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  if (!opened) return null;

  const handleAcknowledge = () => {
    saveAcknowledgment();
    onAcknowledge?.();
  };

  const handleReadFull = () => {
    // Navigating unmounts this modal; the acknowledgment is deliberately
    // not saved so the visitor still sees the notice if they return.
    onClose?.();
    navigate('/data-privacy');
  };

  // Rendered into <body> so the overlay is not trapped inside the AppShell
  // stacking context, which would let the sticky navbar paint over it.
  return createPortal(
    <div className="dp-overlay" onKeyDown={handleKeyDown}>
      <div
        className="dp-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        aria-describedby="dp-body"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="dp-header">
          <svg
            className="dp-header__icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
            <path d="M9.5 12l1.8 1.8 3.4-3.6" />
          </svg>
          <h2 className="dp-title" id="dp-title">
            Data Privacy Notice
          </h2>
        </div>

        <div className="dp-body" id="dp-body">
          <p>
            The San Fabian Population Office respects your right to privacy. This website may
            collect and process your personal information, such as your name, contact details,
            and records you submit, only for the delivery of our services, programs, and
            official records management.
          </p>
          <p>
            Your information is handled in accordance with the Data Privacy Act of 2012
            (Republic Act No. 10173). It is used only for legitimate government purposes, kept
            secure, and not shared with unauthorized parties.
          </p>
          <p>
            By clicking &ldquo;I Understand&rdquo;, you acknowledge that you have read this
            notice. You may read the full Data Privacy Notice for details about your rights and
            how to contact us.
          </p>
        </div>

        <div className="dp-actions">
          <button type="button" className="btn-secondary dp-btn" onClick={handleReadFull}>
            Read Full Notice
          </button>
          <button type="button" className="btn-primary dp-btn" onClick={handleAcknowledge}>
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DataPrivacyModal;
