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

// --- Helper: authenticate user via Bearer token ---

function getAuthUser(PDO $pdo): ?array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];
    $tokenHash = hash('sha256', $token);

    $stmt = $pdo->prepare(
        'SELECT s.user_id, s.expires_at, u.id, u.name, u.email, u.is_admin, u.email_verified
         FROM q_sessions s
         JOIN q_users u ON s.user_id = u.id
         WHERE s.token_hash = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();

    return $row ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGetMatches($pdo);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// --- GET: return matches, optionally filtered by phase, with user predictions if authed ---

function handleGetMatches(PDO $pdo) {
    $phase = $_GET['phase'] ?? '';
    $user  = getAuthUser($pdo);

    // Build query
    if ($user) {
        // Authenticated: include user prediction via LEFT JOIN
        $sql = 'SELECT m.id, m.phase, m.group_label, m.home_team, m.away_team,
                       m.home_abbr, m.away_abbr,
                       m.match_date, m.match_time, m.home_score, m.away_score,
                       m.status, m.is_locked,
                       p.predicted_result, p.predicted_home_score, p.predicted_away_score, p.points_earned
                FROM q_matches m
                LEFT JOIN q_predictions p ON m.id = p.match_id AND p.user_id = ?
                WHERE 1=1';
        $params = [$user['id']];
    } else {
        // Public: no predictions
        $sql = 'SELECT m.id, m.phase, m.group_label, m.home_team, m.away_team,
                       m.home_abbr, m.away_abbr,
                       m.match_date, m.match_time, m.home_score, m.away_score,
                       m.status, m.is_locked,
                       NULL as predicted_result, NULL as predicted_home_score, NULL as predicted_away_score, NULL as points_earned
                FROM q_matches m
                WHERE 1=1';
        $params = [];
    }

    // Filter by phase if provided
    if ($phase) {
        $validPhases = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
        if (!in_array($phase, $validPhases)) {
            http_response_code(400);
            echo json_encode(['error' => "Fase invalida: $phase", 'valid' => $validPhases]);
            return;
        }
        $sql .= ' AND m.phase = ?';
        $params[] = $phase;
    } else {
        // Default: show all open phases
        $sql .= ' AND EXISTS (SELECT 1 FROM q_phases ph WHERE ph.phase = m.phase AND ph.is_open = 1)';
    }

    $sql .= ' ORDER BY m.match_date, m.match_time';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $matches = array_map(function ($row) {
        $match = [
            'id'         => (string) $row['id'],
            'phase'      => $row['phase'],
            'group_label' => $row['group_label'],
            'home_team'  => $row['home_team'],
            'away_team'  => $row['away_team'],
            'home_abbr'  => $row['home_abbr'],
            'away_abbr'  => $row['away_abbr'],
            'match_date' => $row['match_date'],
            'match_time' => $row['match_time'],
            'home_score' => $row['home_score'] !== null ? (int) $row['home_score'] : null,
            'away_score' => $row['away_score'] !== null ? (int) $row['away_score'] : null,
            'status'     => $row['status'],
            'is_locked'  => (bool) $row['is_locked'],
        ];

        // Include prediction if available
        if ($row['predicted_result'] !== null) {
            $match['prediction'] = [
                'predicted_result'     => $row['predicted_result'],
                'predicted_home_score' => $row['predicted_home_score'] !== null ? (int) $row['predicted_home_score'] : null,
                'predicted_away_score' => $row['predicted_away_score'] !== null ? (int) $row['predicted_away_score'] : null,
                'points_earned'        => (int) $row['points_earned'],
            ];
        }

        return $match;
    }, $rows);

    // Open phases (is_open = 1) for tab control on the client.
    // Ordered by tournament progression so the client can default to the first open phase.
    $phaseStmt = $pdo->query(
        'SELECT phase FROM q_phases WHERE is_open = 1
         ORDER BY FIELD(phase, "groups", "round_of_32", "round_of_16", "quarterfinals", "semifinals", "final")'
    );
    $openPhases = $phaseStmt ? $phaseStmt->fetchAll(PDO::FETCH_COLUMN) : [];

    echo json_encode([
        'ok'           => true,
        'matches'      => $matches,
        'phase'        => $phase ?: 'open',
        'open_phases'  => $openPhases,
    ]);
}
