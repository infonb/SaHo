CREATE OR REPLACE PROCEDURE public.getreminders_admin_v2(
    INOUT ref refcursor DEFAULT 'reminders_admin_ref'
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
    WHERE is_deleted = FALSE
    ORDER BY rem_id DESC;
END;
$BODY$;

ALTER PROCEDURE public.getreminders_admin_v2(refcursor)
    OWNER TO postgres;

