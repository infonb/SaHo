import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import type { StudentView } from '../../types';
import StudentProfileSections from './StudentProfileSections';

export default function StudentDetailModal({ student, onClose }: { student: StudentView | null; onClose: () => void }) {
  const navigate = useNavigate();

  if (!student) return null;

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title={student.full_name}
      width={760}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => navigate(`/students/edit/${student.student_id}`)}>Modify Student</Button>
        </>
      }
    >
      <div className="studentProfileModal">
        <StudentProfileSections mode="view" student={student} />
      </div>
    </Modal>
  );
}
