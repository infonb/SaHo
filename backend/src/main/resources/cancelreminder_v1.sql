CREATE OR REPLACE PROCEDURE public.cancelreminder_v1(
    IN p_rem_id integer,
    IN p_updated_by integer DEFAULT NULL
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    -- Mark reminder as cancelled (but keep it visible: is_deleted stays FALSE)
    UPDATE reminders
    SET
        status = FALSE,
        updated_by = COALESCE(p_updated_by, updated_by),
        updated_at = CURRENT_TIMESTAMP
    WHERE rem_id = p_rem_id
      AND is_deleted = FALSE;

    -- Soft delete student mappings so students no longer receive it
    UPDATE student_reminders
    SET is_deleted = TRUE
    WHERE rem_id = p_rem_id
      AND is_deleted = FALSE;
END;
$BODY$;

ALTER PROCEDURE public.cancelreminder_v1(integer, integer)
    OWNER TO postgres;

