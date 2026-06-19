import Modal from '../../components/common/Modal';
import type { ReminderDto } from '../../api/remindersApi';
import EventFormPage from './EventFormPage';

export default function EventDetailModal({
  eventId,
  eventSnapshot,
  onClose,
  locationOptions,
}: {
  eventId: number | null;
  eventSnapshot?: ReminderDto | null;
  onClose: () => void;
  locationOptions?: {
    states?: any[];
    districts?: any[];
    mandals?: any[];
    villages?: any[];
    schools?: any[];
    classes?: any[];
  };
}) {
  if (!eventId) return null;

  return (
    <Modal
      open={!!eventId}
      onClose={onClose}
      title=" "
      width={980}
    >
      <EventFormPage embedded mode="view" eventId={eventId} eventSnapshot={eventSnapshot} onCancel={onClose} locationOptions={locationOptions} />
    </Modal>
  );
}
