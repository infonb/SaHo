import Button from './Button';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  cancelDanger?: boolean;
}
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  icon = 'Remove',
  title,
  message,
  confirmLabel = 'Yes, Remove',
  danger = true,
  cancelDanger = false
}: Props){
  const iconSvg = danger ? (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#fee2e2" />
      <path d="M9 11v6" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 11v6" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#dcfce7" />
      <path d="M8.5 12.5l2.2 2.2L16 9.4" stroke="#166534" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={640}
      footer={(
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
             <Button
  variant="outline"
  className={cancelDanger ? "btnRed" : "btnGreen"}
  style={{ width: 140 }}
  onClick={onClose}
  size="sm"
>
  Cancel
</Button>
          <Button variant={danger ? 'danger' : 'primary'} className={danger ? 'btnRed' : 'btnGreen'} style={{ width: 140 }} onClick={onConfirm} size="sm">{confirmLabel}</Button>
        </div>
      )}
    >
      <div className="confirmModalContent">
        <div className="confirmIcon" aria-hidden>
          {iconSvg}
        </div>
        <div className="confirmBody">
          <div className="confirmLead">{icon}</div>
          <div className="confirmMessage">{message}</div>
        </div>
      </div>
    </Modal>
  );
}
