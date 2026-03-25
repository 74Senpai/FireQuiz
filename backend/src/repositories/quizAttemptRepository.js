/**
 * quizAttemptRepository.js
 * -------------------------------------------------------
 * Tầng truy cập dữ liệu (Data Access Layer) cho chức năng
 * "Dashboard kết quả Quiz" của Chủ Quiz (Creator).
 *
 * Các hàm trong file này thực hiện truy vấn SQL trực tiếp
 * vào database, kết hợp bảng quiz_attempts và users để
 * trả về báo cáo chi tiết về thí sinh.
 * -------------------------------------------------------
 */

import pool from '../db/db.js';

/**
 * Lấy danh sách tất cả lượt thi của một quiz cụ thể.
 * Kết hợp bảng quiz_attempts + users để lấy thông tin thí sinh.
 *
 * Hỗ trợ lọc theo:
 *  - minScore / maxScore : lọc theo khoảng điểm
 *  - startDate / endDate : lọc theo khoảng thời gian nộp bài
 *  - status              : lọc theo trạng thái (SUBMITTED / IN_PROGRESS)
 *  - search              : tìm kiếm theo tên hoặc email thí sinh
 *
 * @param {number} quizId   - ID của quiz cần xem báo cáo
 * @param {object} filters  - Các tham số lọc (tùy chọn)
 * @returns {Promise<Array>} Danh sách kết quả thi
 */
export const getResultsByQuizId = async (quizId, filters = {}, pagination = { limit: 10, offset: 0 }) => {
    const {
        minScore,
        maxScore,
        startDate,
        endDate,
        status,   // 'SUBMITTED' | 'IN_PROGRESS'
        search,
    } = filters;

    // Mảng chứa các điều kiện WHERE động
    const conditions = ['qa.quiz_id = ?'];
    // Mảng chứa các giá trị tương ứng để tránh SQL Injection
    const params = [quizId];

    // --- Lọc theo điểm tối thiểu ---
    if (minScore !== undefined && minScore !== null && minScore !== '') {
        conditions.push('qa.score >= ?');
        params.push(Number(minScore));
    }

    // --- Lọc theo điểm tối đa ---
    if (maxScore !== undefined && maxScore !== null && maxScore !== '') {
        conditions.push('qa.score <= ?');
        params.push(Number(maxScore));
    }

    // --- Lọc theo ngày bắt đầu (thời gian nộp bài từ ngày nào) ---
    if (startDate) {
        conditions.push('qa.finished_at >= ?');
        params.push(startDate);
    }

    // --- Lọc theo ngày kết thúc (thời gian nộp bài đến ngày nào) ---
    if (endDate) {
        // Thêm ' 23:59:59' để bao gồm cả ngày kết thúc
        conditions.push('qa.finished_at <= ?');
        params.push(`${endDate} 23:59:59`);
    }

    // --- Lọc theo trạng thái nộp bài ---
    // SUBMITTED: finished_at IS NOT NULL (đã nộp)
    // IN_PROGRESS: finished_at IS NULL (đang làm)
    if (status === 'SUBMITTED') {
        conditions.push('qa.finished_at IS NOT NULL');
    } else if (status === 'IN_PROGRESS') {
        conditions.push('qa.finished_at IS NULL');
    }

    // --- Tìm kiếm theo tên hoặc email thí sinh ---
    if (search) {
        conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    // Ghép tất cả điều kiện lại thành chuỗi WHERE
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query để đếm tổng số bản ghi
    const countSql = `SELECT COUNT(*) AS total FROM quiz_attempts qa INNER JOIN users u ON qa.user_id = u.id ${whereClause}`;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0]?.total || 0;

    // Query để lấy dữ liệu
    let dataSql = `
    SELECT
      qa.id              AS attempt_id,
      qa.quiz_id,
      qa.quiz_title,
      qa.score,
      qa.started_at,
      qa.finished_at,
      TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds,
      CASE
        WHEN qa.finished_at IS NOT NULL THEN 'SUBMITTED'
        ELSE 'IN_PROGRESS'
      END AS submit_status,
      u.id               AS user_id,
      u.full_name,
      u.email
    FROM quiz_attempts qa
    INNER JOIN users u ON qa.user_id = u.id
    ${whereClause}
    ORDER BY qa.started_at DESC
  `;

    const finalParams = [...params];

    // Chỉ thêm LIMIT và OFFSET nếu có phân trang
    if (pagination && pagination.limit > 0) {
        dataSql += ' LIMIT ? OFFSET ?';
        finalParams.push(pagination.limit, pagination.offset || 0);
    }

    const [rows] = await pool.execute(dataSql, finalParams);
    return { data: rows, total };
};

/**
 * Lấy thống kê tổng quan của một quiz:
 * - Tổng số lượt thi
 * - Số lượt đã nộp bài
 * - Điểm trung bình
 * - Điểm cao nhất
 * - Điểm thấp nhất
 *
 * @param {number} quizId - ID của quiz
 * @returns {Promise<object>} Thống kê tổng quan
 */
export const getQuizStatsByQuizId = async (quizId) => {
    const sql = `
    SELECT
      COUNT(*)                                    AS total_attempts,
      SUM(CASE WHEN finished_at IS NOT NULL THEN 1 ELSE 0 END) AS submitted_count,
      SUM(CASE WHEN finished_at IS NULL     THEN 1 ELSE 0 END) AS in_progress_count,
      ROUND(AVG(CASE WHEN finished_at IS NOT NULL THEN score END), 2) AS avg_score,
      MAX(CASE WHEN finished_at IS NOT NULL THEN score END)    AS max_score,
      MIN(CASE WHEN finished_at IS NOT NULL THEN score END)    AS min_score
    FROM quiz_attempts
    WHERE quiz_id = ?
  `;

    const [rows] = await pool.execute(sql, [quizId]);
    // Trả về object thống kê (hàng đầu tiên)
    return rows[0] || {};
};
