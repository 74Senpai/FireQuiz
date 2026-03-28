import { readFileSync } from 'node:fs';

import pool from '../db/db.js';

const readSqlFile = (relativePath) =>
    readFileSync(new URL(relativePath, import.meta.url), 'utf8').trim();

const QUIZ_RESULTS_COUNT_SQL = readSqlFile('./sql/getQuizResultsCount.sql');
const QUIZ_RESULTS_DATA_SQL = readSqlFile('./sql/getQuizResultsData.sql');
const QUIZ_STATS_SQL = readSqlFile('./sql/getQuizStats.sql');
const QUIZ_LEADERBOARD_SQL = readSqlFile('./sql/getQuizLeaderboard.sql');

const buildWhereClause = (filters = {}) => {
    const {
        minScore,
        maxScore,
        startDate,
        endDate,
        status,
        search,
    } = filters;

    const conditions = ['qa.quiz_id = ?'];
    const params = [];

    if (minScore !== undefined && minScore !== null && minScore !== '') {
        conditions.push('qa.score >= ?');
        params.push(Number(minScore));
    }

    if (maxScore !== undefined && maxScore !== null && maxScore !== '') {
        conditions.push('qa.score <= ?');
        params.push(Number(maxScore));
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

export const getResultsByQuizId = async (quizId, filters = {}, pagination = { limit: 10, offset: 0 }) => {
    const { whereClause, params } = buildWhereClause(filters);
    const baseParams = [quizId, ...params];

    const countSql = QUIZ_RESULTS_COUNT_SQL.replace('__WHERE_CLAUSE__', whereClause);
    const [countRows] = await pool.execute(countSql, baseParams);
    const total = countRows[0]?.total || 0;

    const hasPagination = pagination && pagination.limit > 0;
    const paginationClause = hasPagination ? 'LIMIT ? OFFSET ?' : '';
    const dataSql = QUIZ_RESULTS_DATA_SQL
        .replace('__WHERE_CLAUSE__', whereClause)
        .replace('__PAGINATION_CLAUSE__', paginationClause);

    const finalParams = hasPagination
        ? [...baseParams, pagination.limit, pagination.offset || 0]
        : baseParams;

    const [rows] = await pool.execute(dataSql, finalParams);
    return { data: rows, total };
};

export const getQuizStatsByQuizId = async (quizId) => {
    const [rows] = await pool.execute(QUIZ_STATS_SQL, [quizId]);
    return rows[0] || {};
};

export const getLeaderboardByQuizId = async (quizId, limit = 10) => {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const [rows] = await pool.execute(QUIZ_LEADERBOARD_SQL, [quizId, safeLimit]);
    return rows;
};
