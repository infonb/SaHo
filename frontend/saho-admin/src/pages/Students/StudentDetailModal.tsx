import Modal from '../../components/common/Modal';
import type { StudentView } from '../../types';
import StudentFormPage from './StudentFormPage';

export default function StudentDetailModal({ student, onClose }: { student: StudentView | null; onClose: () => void }) {
  if (!student) return null;

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title=" "
      width={980}
    >
      <StudentFormPage embedded mode="view" studentId={student.student_id} studentSnapshot={student} onCancel={onClose} />
    </Modal>
  );
}
