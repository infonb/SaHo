CREATE OR REPLACE PROCEDURE public.filter_sort_students_saho_v2(
    IN p_search text DEFAULT NULL,
    IN p_gender text DEFAULT NULL,
    IN p_class_ids_csv text DEFAULT NULL,
    IN p_orphan_status text DEFAULT NULL,
    IN p_state_ids_csv text DEFAULT NULL,
    IN p_dist_ids_csv text DEFAULT NULL,
    IN p_mndl_ids_csv text DEFAULT NULL,
    IN p_vil_ids_csv text DEFAULT NULL,
    IN p_sch_ids_csv text DEFAULT NULL,
    IN p_page_number integer DEFAULT 1,
    IN p_page_size integer DEFAULT 10,
    IN p_sort_column text DEFAULT 'student_id',
    IN p_sort_direction text DEFAULT 'DESC',
    INOUT ref refcursor DEFAULT 'student_filter_ref'
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_query text;
    v_count_query text;
    v_sort_column text;
    v_sort_direction text;
    v_offset integer := GREATEST(COALESCE(p_page_number, 1) - 1, 0) * GREATEST(COALESCE(p_page_size, 10), 1);
BEGIN
    CASE p_sort_column
        WHEN 'student_name' THEN v_sort_column := 'student_name';
        WHEN 'gender' THEN v_sort_column := 's.gender';
        WHEN 'class_name' THEN v_sort_column := 'cm.class_name';
        WHEN 'school_name' THEN v_sort_column := 'sc.sch_name';
        WHEN 'village_name' THEN v_sort_column := 'vm.vil_name';
        WHEN 'mandal_name' THEN v_sort_column := 'mm.mndl_name';
        WHEN 'district_name' THEN v_sort_column := 'dm.dist_name';
        WHEN 'state_name' THEN v_sort_column := 'stm.st_name';
        ELSE v_sort_column := 's.student_id';
    END CASE;

    IF UPPER(COALESCE(TRIM(p_sort_direction), 'DESC')) = 'ASC' THEN
        v_sort_direction := 'ASC';
    ELSE
        v_sort_direction := 'DESC';
    END IF;

    v_query := '
        FROM students s
        LEFT JOIN class_master cm ON s.class_id = cm.class_id
        LEFT JOIN guardians g ON s.guardian_id = g.guardian_id
        LEFT JOIN school_master sc ON s.sch_id = sc.sch_id
        LEFT JOIN village_master vm ON sc.vil_id = vm.vil_id
        LEFT JOIN mandal_master mm ON vm.mndl_id = mm.mndl_id
        LEFT JOIN district_master dm ON mm.dist_id = dm.dist_id
        LEFT JOIN state_master stm ON dm.st_id = stm.st_id
        WHERE COALESCE(s.is_deleted, FALSE) = FALSE
    ';

    IF p_search IS NOT NULL AND TRIM(p_search) <> '' THEN
        v_query := v_query || format(
            ' AND LOWER(CONCAT_WS('' '', s.first_name, s.middle_name, s.last_name, COALESCE(g.first_name, ''''), COALESCE(g.middle_name, ''''), COALESCE(g.last_name, ''''), COALESCE(sc.sch_name, ''''), COALESCE(vm.vil_name, ''''), COALESCE(mm.mndl_name, ''''), COALESCE(dm.dist_name, ''''), COALESCE(stm.st_name, ''''))) LIKE LOWER(%L)',
            '%' || TRIM(p_search) || '%'
        );
    END IF;

    IF p_gender IS NOT NULL AND TRIM(p_gender) <> '' THEN
        v_query := v_query || format(' AND LOWER(s.gender) = LOWER(%L)', TRIM(p_gender));
    END IF;

    IF p_class_ids_csv IS NOT NULL AND TRIM(p_class_ids_csv) <> '' THEN
        v_query := v_query || format(' AND s.class_id::text = ANY(string_to_array(%L, '',''))', p_class_ids_csv);
    END IF;

    IF p_orphan_status IS NOT NULL AND TRIM(p_orphan_status) <> '' THEN
        v_query := v_query || format(' AND LOWER(s.orphan_status) = LOWER(%L)', TRIM(p_orphan_status));
    END IF;

    IF p_state_ids_csv IS NOT NULL AND TRIM(p_state_ids_csv) <> '' THEN
        v_query := v_query || format(' AND stm.st_id::text = ANY(string_to_array(%L, '',''))', p_state_ids_csv);
    END IF;

    IF p_dist_ids_csv IS NOT NULL AND TRIM(p_dist_ids_csv) <> '' THEN
        v_query := v_query || format(' AND dm.dist_id::text = ANY(string_to_array(%L, '',''))', p_dist_ids_csv);
    END IF;

    IF p_mndl_ids_csv IS NOT NULL AND TRIM(p_mndl_ids_csv) <> '' THEN
        v_query := v_query || format(' AND mm.mndl_id::text = ANY(string_to_array(%L, '',''))', p_mndl_ids_csv);
    END IF;

    IF p_vil_ids_csv IS NOT NULL AND TRIM(p_vil_ids_csv) <> '' THEN
        v_query := v_query || format(' AND vm.vil_id::text = ANY(string_to_array(%L, '',''))', p_vil_ids_csv);
    END IF;

    IF p_sch_ids_csv IS NOT NULL AND TRIM(p_sch_ids_csv) <> '' THEN
        v_query := v_query || format(' AND sc.sch_id::text = ANY(string_to_array(%L, '',''))', p_sch_ids_csv);
    END IF;

    v_count_query := 'SELECT COUNT(*) ' || v_query;

    OPEN ref FOR EXECUTE '
        SELECT
            s.student_id,
            CONCAT_WS('' '', s.first_name, s.middle_name, s.last_name) AS student_name,
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
            CONCAT_WS('' '', g.first_name, g.middle_name, g.last_name) AS guardian_name,
            vm.vil_id,
            vm.vil_name,
            mm.mndl_id,
            mm.mndl_name,
            dm.dist_id,
            dm.dist_name,
            stm.st_id,
            stm.st_name,
            s.sibling_id,
            s.orphan_status,
            s.image_url,
            s.created_at,
            s.created_by,
            s.modified_at,
            s.modified_by,
            (' || v_count_query || ') AS total_count
        ' || v_query || '
        ORDER BY ' || v_sort_column || ' ' || v_sort_direction || '
        LIMIT ' || GREATEST(COALESCE(p_page_size, 10), 1) || '
        OFFSET ' || v_offset;
END;
$BODY$;
