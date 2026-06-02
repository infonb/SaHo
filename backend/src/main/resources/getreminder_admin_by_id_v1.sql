CREATE OR REPLACE PROCEDURE public.getreminder_admin_by_id_v1(
    IN p_rem_id integer,
    INOUT ref refcursor DEFAULT 'reminder_admin_by_id_ref'
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    OPEN ref FOR
    SELECT
        rem_id,
        title,
        description,
        event_date,
        venue,
        st_id_csv,
        dist_ids_csv,
        mndl_ids_csv,
        vil_ids_csv,
        sch_ids_csv,
        class_ids_csv,
        status,
        created_by,
        created_at,
        updated_at
    FROM reminders
    WHERE rem_id = p_rem_id
      AND is_deleted = FALSE;
END;
$BODY$;

ALTER PROCEDURE public.getreminder_admin_by_id_v1(integer, refcursor)
    OWNER TO postgres;

