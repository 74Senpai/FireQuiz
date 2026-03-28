import pool from '../db/db.js';

const buildAttemptFilters = (quizId, filters = {}) => {
    const {
        minScore,
        maxScore,
        minDurationSeconds,
        maxDurationSeconds,
        startDate,
        endDate,
        status,
        search,
    } = filters;

    const conditions = ['qa.quiz_id = ?'];
    const params = [quizId];

    if (minScore !== undefined && minScore !== null && minScore !== '') {
        conditions.push('qa.score >= ?');
        params.push(Number(minScore));
    }

    if (maxScore !== undefined && maxScore !== null && maxScore !== '') {
        conditions.push('qa.score <= ?');
        params.push(Number(maxScore));
    }

    if (
        minDurationSeconds !== undefined &&
        minDurationSeconds !== null &&
        minDurationSeconds !== ''
    ) {
        conditions.push('TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) >= ?');
        params.push(Number(minDurationSeconds));
    }

    if (
        maxDurationSeconds !== undefined &&
        maxDurationSeconds !== null &&
        maxDurationSeconds !== ''
    ) {
        conditions.push('TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) <= ?');
        params.push(Number(maxDurationSeconds));
    }

    if (startDate) {
        conditions.push('qa.finished_at >= ?');
        params.push(startDate);
    }

    if (endDate) {
        conditions.push('qa.finished_at <= ?');
        params.push(`${endDate} 23:59:59`);
    }

    if (status === 'SUBMITTED') {
        conditions.push('qa.finished_at IS NOT NULL');
    } else if (status === 'IN_PROGRESS') {
        conditions.push('qa.finished_at IS NULL');
    }

    if (search) {
        conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    return {
        whereClause: `WHERE ${conditions.join(' AND ')}`,
        params,
    };
};

export const countAttemptsByQuizId = async (quizId, filters = {}) => {
    const { whereClause, params } = buildAttemptFilters(quizId, filters);
    const sql = `
        SELECT COUNT(*) AS total
        FROM quiz_attempts qa
        INNER JOIN users u ON qa.user_id = u.id
        ${whereClause};
    `;

    const [rows] = await pool.execute(sql, params);
    return rows[0]?.total || 0;
};

export const getAttemptsWithUsersByQuizId = async (
    quizId,
    filters = {},
    pagination = { limit: 10, offset: 0 }
) => {
    const { whereClause, params } = buildAttemptFilters(quizId, filters);

    let sql = `
        SELECT
            qa.id AS attempt_id,
            qa.quiz_id,
            qa.quiz_title,
            qa.score,
            qa.started_at,
            qa.finished_at,
            u.id AS user_id,
            u.full_name,
            u.email
        FROM quiz_attempts qa
        INNER JOIN users u ON qa.user_id = u.id
        ${whereClause}
        ORDER BY qa.started_at DESC
    `;

    const finalParams = [...params];

    if (pagination && pagination.limit > 0) {
        sql += ' LIMIT ? OFFSET ?';
        finalParams.push(pagination.limit, pagination.offset || 0);
    }

    const [rows] = await pool.execute(sql, finalParams);
    return rows;
};

export const getAttemptsByQuizId = async (quizId) => {
    const sql = `
        SELECT id, quiz_id, quiz_title, score, started_at, finished_at
        FROM quiz_attempts
        WHERE quiz_id = ?
        ORDER BY started_at DESC;
    `;

    const [rows] = await pool.execute(sql, [quizId]);
    return rows;
};

export const getSubmittedAttemptsWithUsersByQuizId = async (quizId) => {
    const sql = `
        SELECT
            qa.id AS attempt_id,
            qa.quiz_id,
            qa.quiz_title,
            qa.score,
            qa.started_at,
            qa.finished_at,
            u.id AS user_id,
            u.full_name,
            u.email
        FROM quiz_attempts qa
        INNER JOIN users u ON qa.user_id = u.id
        WHERE qa.quiz_id = ?
          AND qa.finished_at IS NOT NULL
          AND qa.score IS NOT NULL
        ORDER BY qa.started_at DESC;
    `;

    const [rows] = await pool.execute(sql, [quizId]);
    return rows;
};
