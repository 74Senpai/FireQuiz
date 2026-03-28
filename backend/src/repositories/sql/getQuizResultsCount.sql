SELECT COUNT(*) AS total
FROM quiz_attempts qa
INNER JOIN users u ON qa.user_id = u.id
__WHERE_CLAUSE__;
