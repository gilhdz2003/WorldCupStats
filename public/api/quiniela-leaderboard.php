<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGetLeaderboard($pdo);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// --- GET: return leaderboard with rank positions ---

function handleGetLeaderboard(PDO $pdo) {
    $phase = $_GET['phase'] ?? 'all';

    // Validate phase filter if not 'all'
    $phaseFilter = '';
    $params = [];
    if ($phase !== 'all') {
        $validPhases = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
        if (!in_array($phase, $validPhases)) {
            http_response_code(400);
            echo json_encode(['error' => "Fase invalida: $phase", 'valid' => $validPhases]);
            return;
        }
        $phaseFilter = ' AND m.phase = ?';
        $params[] = $phase;
    }

    $sql = "SELECT u.id, u.name,
                   COALESCE(SUM(p.points_earned), 0) as total_points,
                   COUNT(DISTINCT CASE WHEN sl.reason = 'exact_score'
                       THEN CONCAT(sl.match_id, '-', sl.user_id) END) as exact_scores,
                   COUNT(DISTINCT CASE WHEN sl.reason IS NOT NULL
                       THEN CONCAT(sl.match_id, '-', sl.user_id) END) as correct_results,
                   COALESCE(SUM(
                     CASE WHEN m.status = 'finished'
                          AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
                          AND p.predicted_home_score IS NOT NULL AND p.predicted_away_score IS NOT NULL
                     THEN (ABS(p.predicted_home_score - m.home_score) + ABS(p.predicted_away_score - m.away_score))
                     ELSE 0 END
                   ), 0) as goal_diff
            FROM q_users u
            LEFT JOIN q_predictions p ON u.id = p.user_id
            LEFT JOIN q_matches m ON p.match_id = m.id
            LEFT JOIN q_scoring_log sl ON p.match_id = sl.match_id AND p.user_id = sl.user_id
            WHERE u.email_verified = 1
            $phaseFilter
            GROUP BY u.id
            ORDER BY total_points DESC, exact_scores DESC, correct_results DESC, goal_diff ASC, u.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Assign rank positions (handle ties)
    // Puesto único: sube de rank si cambia cualquiera de los desempates
    // (puntos → exactos → aciertos → gol_diff). Solo un "dead heat" perfecto
    // (idéntico en los 4) comparte puesto.
    $leaderboard = [];
    $currentRank = 0;
    $prevPoints   = null;
    $prevExact    = null;
    $prevCorrect  = null;
    $prevGoalDiff = null;

    foreach ($rows as $row) {
        $points    = (int) $row['total_points'];
        $exact     = (int) $row['exact_scores'];
        $correct   = (int) $row['correct_results'];
        $goalDiff  = (int) $row['goal_diff'];

        // Same rank only if ALL tiebreakers match the previous row
        if ($points !== $prevPoints || $exact !== $prevExact
            || $correct !== $prevCorrect || $goalDiff !== $prevGoalDiff) {
            $currentRank++;
        }

        $leaderboard[] = [
            'rank'             => $currentRank,
            'id'               => (int) $row['id'],
            'name'             => $row['name'],
            'total_points'     => $points,
            'exact_scores'     => $exact,
            'correct_results'  => $correct,
            'goal_diff'        => $goalDiff,
        ];

        $prevPoints   = $points;
        $prevExact    = $exact;
        $prevCorrect  = $correct;
        $prevGoalDiff = $goalDiff;
    }

    echo json_encode([
        'ok'          => true,
        'leaderboard' => $leaderboard,
        'phase'       => $phase,
        'count'       => count($leaderboard),
    ]);
}
