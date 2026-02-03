-- 📊 SQL TRA CỨU CẤU TRÚC DATABASE PROJECT (Ground Truth)
-- Copy toàn bộ đoạn này chạy trong Supabase SQL Editor và gửi lại kết quả JSON cho AI.
WITH -- 1. Lấy danh sách Tables & Columns
param_tables AS (
    SELECT c.table_name,
        json_agg(
            json_build_object(
                'column',
                c.column_name,
                'type',
                c.data_type,
                'nullable',
                c.is_nullable
            )
            ORDER BY c.ordinal_position
        ) as columns
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    GROUP BY c.table_name
),
-- 2. Lấy danh sách Functions (RPC)
param_functions AS (
    SELECT r.routine_name,
        json_agg(
            json_build_object(
                'param_name',
                p.parameter_name,
                'param_type',
                p.data_type,
                'mode',
                p.parameter_mode
            )
        ) as params,
        r.data_type as return_type
    FROM information_schema.routines r
        LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
    WHERE r.routine_schema = 'public'
        AND r.routine_type = 'FUNCTION'
    GROUP BY r.routine_name,
        r.data_type
) -- 3. Tổng hợp thành 1 JSON duy nhất
SELECT json_build_object(
        'tables',
        (
            SELECT json_agg(row_to_json(t))
            FROM param_tables t
        ),
        'functions',
        (
            SELECT json_agg(row_to_json(f))
            FROM param_functions f
        )
    ) as DATABASE_SCHEMA_REPORT;