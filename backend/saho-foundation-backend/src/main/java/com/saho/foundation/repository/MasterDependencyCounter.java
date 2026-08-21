package com.saho.foundation.repository;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Component;

@Component
public class MasterDependencyCounter {

    private final EntityManager entityManager;

    public MasterDependencyCounter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    private long count(String sql, Integer param) {
        Number result = (Number) entityManager.createNativeQuery(sql)
                .setParameter("id", param)
                .getSingleResult();
        return result == null ? 0L : result.longValue();
    }

    public long districtsByState(Integer stId) {
        return count("select count(*) from district_master where st_id = :id and is_deleted = false", stId);
    }

    public long mandalsByDistrict(Integer distId) {
        return count("select count(*) from mandal_master where dist_id = :id and is_deleted = false", distId);
    }

    public long villagesByMandal(Integer mndlId) {
        return count("select count(*) from village_master where mndl_id = :id and is_deleted = false", mndlId);
    }

    public long schoolsByVillage(Integer vilId) {
        return count("select count(*) from school_master where vil_id = :id and is_deleted = false", vilId);
    }

    public long schoolsByMandal(Integer mndlId) {
        return count("select count(*) from school_master sm "
                + "join village_master vm on vm.vil_id = sm.vil_id and vm.is_deleted = false "
                + "where vm.mndl_id = :id and sm.is_deleted = false", mndlId);
    }

    public long villagesByDistrict(Integer distId) {
        return count("select count(*) from village_master vm "
                + "join mandal_master mm on mm.mndl_id = vm.mndl_id and mm.is_deleted = false "
                + "where mm.dist_id = :id and vm.is_deleted = false", distId);
    }

    public long schoolsByDistrict(Integer distId) {
        return count("select count(*) from school_master sm "
                + "join village_master vm on vm.vil_id = sm.vil_id and vm.is_deleted = false "
                + "join mandal_master mm on mm.mndl_id = vm.mndl_id and mm.is_deleted = false "
                + "where mm.dist_id = :id and sm.is_deleted = false", distId);
    }

    public long classesByCourse(Integer courseId) {
        return count("select count(*) from class_master where course_id = :id and is_deleted = false", courseId);
    }

    private static final String STUDENT_UNION =
            "select count(*) from ("
                    + " select distinct s.student_id from students s where %s and s.is_deleted = false "
                    + " union "
                    + " select distinct sa.student_id from student_academic sa where %s and sa.is_deleted = false"
                    + ") x";

    public long studentsBySchool(Integer schId) {
        return count(String.format(STUDENT_UNION, "s.sch_id = :id", "sa.school_id = :id"), schId);
    }

    public long studentsByClass(Integer classId) {
        return count(String.format(STUDENT_UNION, "s.class_id = :id", "sa.class_id = :id"), classId);
    }

    public long studentsByAcademicYear(Integer ayId) {
        return count(String.format(STUDENT_UNION, "s.academic_year_id = :id", "sa.academic_year_id = :id"), ayId);
    }

    public long studentsByCourse(Integer courseId) {
        return count(String.format(STUDENT_UNION,
                "s.class_id in (select cm.class_id from class_master cm where cm.course_id = :id and cm.is_deleted = false)",
                "sa.class_id in (select cm.class_id from class_master cm where cm.course_id = :id and cm.is_deleted = false)"),
                courseId);
    }

    public long studentsByCaste(Integer casteId) {
        return count("select count(*) from students where caste_id = :id and is_deleted = false", casteId);
    }

    public long studentsAtVillageChain(String whereCondition, Integer id) {
        return count("select count(distinct sa.student_id) from student_academic sa "
                + "join school_master sm on sm.sch_id = sa.school_id and sm.is_deleted = false "
                + "join village_master vm on vm.vil_id = sm.vil_id and vm.is_deleted = false "
                + "join mandal_master mm on mm.mndl_id = vm.mndl_id and mm.is_deleted = false "
                + "join district_master dm on dm.dist_id = mm.dist_id and dm.is_deleted = false "
                + "join students s on s.student_id = sa.student_id and s.is_deleted = false "
                + "where sa.is_deleted = false and " + whereCondition, id);
    }

    public long studentsByState(Integer stId) { return studentsAtVillageChain("dm.st_id = :id", stId); }
    public long studentsByDistrict(Integer distId) { return studentsAtVillageChain("dm.dist_id = :id", distId); }
    public long studentsByMandal(Integer mndlId) { return studentsAtVillageChain("mm.mndl_id = :id", mndlId); }
    public long studentsByVillage(Integer vilId) { return studentsAtVillageChain("vm.vil_id = :id", vilId); }

    public long guardiansByRelationship(Integer relationshipId) {
        return count("select count(*) from guardians where relationship_id = :id and is_deleted = false", relationshipId);
    }

    public long courseSubjectsByCourse(Integer courseId) {
        return count("select count(*) from course_subject where course_id = :id and is_deleted = false", courseId);
    }

    public long courseSubjectsByClass(Integer classId) {
        return count("select count(*) from course_subject where class_id = :id and is_deleted = false", classId);
    }

    public long courseSubjectsBySubject(Integer subjectId) {
        return count("select count(*) from course_subject where subject_id = :id and is_deleted = false", subjectId);
    }

    private long remindersByCsv(String column, Integer id) {
        return count("select count(*) from reminders where is_deleted = false "
                + "and (',' || " + column + " || ',') like '%,' || :id || ',%'", id);
    }

    public long remindersByDistrict(Integer distId) { return remindersByCsv("dist_ids_csv", distId); }
    public long remindersByMandal(Integer mndlId) { return remindersByCsv("mndl_ids_csv", mndlId); }
    public long remindersByVillage(Integer vilId) { return remindersByCsv("vil_ids_csv", vilId); }
    public long remindersBySchool(Integer schId) { return remindersByCsv("sch_ids_csv", schId); }
    public long remindersByClass(Integer classId) { return remindersByCsv("class_ids_csv", classId); }

    public long remindersByState(Integer stId) {
        return count("select count(*) from reminders r "
                + "where r.is_deleted = false and exists ("
                + "select 1 from district_master dm where dm.st_id = :id and dm.is_deleted = false "
                + "and (',' || r.dist_ids_csv || ',') like '%,' || dm.dist_id || ',%')", stId);
    }
}