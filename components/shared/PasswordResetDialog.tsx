import { useState } from 'react';
import { Button } from 'react-daisyui';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import Modal from './Modal';

interface PasswordResetDialogProps {
  visible: boolean;
  temporaryPassword: string;
  memberName: string;
  onClose: () => void;
}

const PasswordResetDialog = ({
  visible,
  temporaryPassword,
  memberName,
  onClose,
}: PasswordResetDialogProps) => {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const copy_password = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handle_close = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Modal open={visible} close={handle_close}>
      <Modal.Header>
        {t('password-reset-complete')}
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('password-reset-description', { name: memberName })}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t('security-notice')}
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  {t('password-one-time-warning')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('temporary-password')}
                </label>
                <div className="font-mono text-lg bg-white border rounded px-3 py-2 break-all">
                  {temporaryPassword}
                </div>
              </div>
              <Button
                size="sm"
                color="primary"
                variant="outline"
                className="ml-3"
                onClick={copy_password}
                startIcon={
                  copied ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )
                }
              >
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {t('password-change-reminder')}
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button color="primary" onClick={handle_close}>
          {t('password-reset-confirm-close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PasswordResetDialog;