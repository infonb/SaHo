CREATE OR REPLACE PROCEDURE public.getallstudents_v3(
    IN p_search text DEFAULT NULL,
    IN p_page_number integer DEFAULT 1,
    IN p_page_size integer DEFAULT 10,
    IN p_gender text DEFAULT NULL,
    IN p_class_filter_csv text DEFAULT NULL,
    IN p_orphan_status text DEFAULT NULL,
    IN p_state_ids_csv text DEFAULT NULL,
    IN p_dist_ids_csv text DEFAULT NULL,
    IN p_mndl_ids_csv text DEFAULT NULL,
    IN p_vil_ids_csv text DEFAULT NULL,
    IN p_sch_ids_csv text DEFAULT NULL,
    IN p_sort_column text DEFAULT 'student_id',
    IN p_sort_direction text DEFAULT 'DESC',
    INOUT ref refcursor DEFAULT 'student_list_ref'
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_page_number integer := GREATEST(COALESCE(p_page_number, 1), 1);
    v_page_size integer := GREATEST(COALESCE(p_page_size, 10), 1);
    v_offset integer := (GREATEST(COALESCE(p_page_number, 1), 1) - 1) * GREATEST(COALESCE(p_page_size, 10), 1);
BEGIN
    OPEN ref FOR
    WITH filtered AS (
        SELECT
            s.student_id,
            CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
            s.email_id,
            s.dob,
            s.gender,
            s.aadhaar_number,
            s.caste_id,
            s.religion,
            s.blood_group,
            s.sch_id,
            s.class_id,
            s.guardian_id,
            sc.sch_name,
            sc.sch_address,
            cm.class_name,
            CONCAT_WS(' ', g.first_name, g.middle_name, g.last_name) AS guardian_name,
            rm.relationship_name,
            vm.vil_name,
            mm.mndl_name,
            dm.dist_name,
            stm.st_name,
            s.sibling_id,
            s.orphan_status,
            s.image_url,
            s.created_at,
            s.created_by,
            s.modified_at,
            s.modified_by
        FROM students s
        LEFT JOIN class_master cm
            ON s.class_id = cm.class_id
        LEFT JOIN guardians g
            ON s.guardian_id = g.guardian_id
        LEFT JOIN relationship_master rm
            ON g.relationship_id = rm.relationship_id
        LEFT JOIN school_master sc
            ON s.sch_id = sc.sch_id
        LEFT JOIN village_master vm
            ON sc.vil_id = vm.vil_id
        LEFT JOIN mandal_master mm
            ON vm.mndl_id = mm.mndl_id
        LEFT JOIN district_master dm
            ON mm.dist_id = dm.dist_id
        LEFT JOIN state_master stm
            ON dm.st_id = stm.st_id
        WHERE COALESCE(s.is_deleted, FALSE) = FALSE
          AND (
              p_search IS NULL OR TRIM(p_search) = '' OR
              LOWER(CONCAT_WS(
                  ' ',
                  s.first_name,
                  s.middle_name,
                  s.last_name,
                  COALESCE(g.first_name, ''),
                  COALESCE(g.middle_name, ''),
                  COALESCE(g.last_name, ''),
                  COALESCE(sc.sch_name, ''),
                  COALESCE(vm.vil_name, ''),
                  COALESCE(mm.mndl_name, ''),
                  COALESCE(dm.dist_name, ''),
                  COALESCE(stm.st_name, '')
              )) LIKE LOWER('%' || TRIM(p_search) || '%')
          )
          AND (
              p_gender IS NULL OR TRIM(p_gender) = '' OR
              LOWER(s.gender) = LOWER(TRIM(p_gender))
          )
          AND (
              p_class_filter_csv IS NULL OR TRIM(p_class_filter_csv) = '' OR
              s.class_id::text = ANY(string_to_array(p_class_filter_csv, ',')) OR
              cm.class_name = ANY(string_to_array(p_class_filter_csv, ','))
          )
          AND (
              p_orphan_status IS NULL OR TRIM(p_orphan_status) = '' OR
              LOWER(s.orphan_status) = LOWER(TRIM(p_orphan_status))
          )
          AND (
              p_state_ids_csv IS NULL OR TRIM(p_state_ids_csv) = '' OR
              stm.st_id::text = ANY(string_to_array(p_state_ids_csv, ','))
          )
          AND (
              p_dist_ids_csv IS NULL OR TRIM(p_dist_ids_csv) = '' OR
              dm.dist_id::text = ANY(string_to_array(p_dist_ids_csv, ','))
          )
          AND (
              p_mndl_ids_csv IS NULL OR TRIM(p_mndl_ids_csv) = '' OR
              mm.mndl_id::text = ANY(string_to_array(p_mndl_ids_csv, ','))
          )
          AND (
              p_vil_ids_csv IS NULL OR TRIM(p_vil_ids_csv) = '' OR
              vm.vil_id::text = ANY(string_to_array(p_vil_ids_csv, ','))
          )
          AND (
              p_sch_ids_csv IS NULL OR TRIM(p_sch_ids_csv) = '' OR
              sc.sch_id::text = ANY(string_to_array(p_sch_ids_csv, ','))
          )
    )
    SELECT
        student_id,
        student_name,
        email_id,
        dob,
        gender,
        aadhaar_number,
        caste_id,
        religion,
        blood_group,
        sch_id,
        class_id,
        guardian_id,
        sch_name,
        sch_address,
        class_name,
        guardian_name,
        relationship_name,
        vil_name,
        mndl_name,
        dist_name,
        st_name,
        sibling_id,
        orphan_status,
        image_url,
        created_at,
        created_by,
        modified_at,
        modified_by,
        COUNT(*) OVER()::integer AS total_count
    FROM filtered
    ORDER BY student_id DESC
    LIMIT v_page_size
    OFFSET v_offset;
END;
$BODY$;

ALTER PROCEDURE public.getallstudents_v3(
    text,
    integer,
    integer,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    refcursor
) OWNER TO postgres;
