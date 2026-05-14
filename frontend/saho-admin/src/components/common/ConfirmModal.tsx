import Button from './Button';
import Modal from './Modal';

interface Props { open: boolean; onClose: () => void; onConfirm: () => void; icon?: string; title: string; message: string; confirmLabel?: string; danger?: boolean; }
export default function ConfirmModal({ open, onClose, onConfirm, icon = 'Remove', title, message, confirmLabel = 'Yes, Remove', danger = true }: Props) {
  return <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></>}><div className="rowFlex"><strong>{icon}</strong><p>{message}</p></div></Modal>;
}
