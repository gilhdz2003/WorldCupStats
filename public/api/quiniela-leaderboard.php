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
                   COUNT(CASE WHEN p.points_earned = 5 THEN 1 END) as exact_scores,
                   COUNT(CASE WHEN p.points_earned >= 3 THEN 1 END) as correct_results
            FROM q_users u
            LEFT JOIN q_predictions p ON u.id = p.user_id
            LEFT JOIN q_matches m ON p.match_id = m.id
            WHERE u.email_verified = 1
            $phaseFilter
            GROUP BY u.id
            ORDER BY total_points DESC, exact_scores DESC, u.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Assign rank positions (handle ties)
    $leaderboard = [];
    $currentRank = 0;
    $prevPoints  = null;
    $prevExact   = null;

    foreach ($rows as $row) {
        $points    = (int) $row['total_points'];
        $exact     = (int) $row['exact_scores'];
        $correct   = (int) $row['correct_results'];

        // Same rank if same points AND same exact_scores as previous
        if ($points !== $prevPoints || $exact !== $prevExact) {
            $currentRank++;
        }

        $leaderboard[] = [
            'rank'             => $currentRank,
            'id'               => (int) $row['id'],
            'name'             => $row['name'],
            'total_points'     => $points,
            'exact_scores'     => $exact,
            'correct_results'  => $correct,
        ];

        $prevPoints = $points;
        $prevExact  = $exact;
    }

    echo json_encode([
        'ok'          => true,
        'leaderboard' => $leaderboard,
        'phase'       => $phase,
        'count'       => count($leaderboard),
    ]);
}
