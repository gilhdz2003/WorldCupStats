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

// --- Helper: authenticate admin user ---

function getAdminUser(PDO $pdo): ?array {
    $user = getAuthUser($pdo);
    if (!$user) {
        return null;
    }
    if (!(bool) $user['is_admin']) {
        return null;
    }
    return $user;
}

// --- Helper: require admin or die ---

function requireAdmin(PDO $pdo): ?array {
    $admin = getAdminUser($pdo);
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado o sin privilegios de admin']);
        exit;
    }
    return $admin;
}

// --- Helper: scoring logic for a match ---

function getPhasePoints(PDO $pdo, string $phase): array {
    $stmt = $pdo->prepare('SELECT points_correct, points_exact FROM q_phases WHERE phase = ?');
    $stmt->execute([$phase]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return [
        'correct' => (int) ($row['points_correct'] ?? 3),
        'exact'   => (int) ($row['points_exact'] ?? 5),
    ];
}

function scoreMatchPredictions(PDO $pdo, int $matchId): int {
    // Get match scores and phase
    $matchStmt = $pdo->prepare('SELECT home_score, away_score, phase FROM q_matches WHERE id = ?');
    $matchStmt->execute([$matchId]);
    $match = $matchStmt->fetch();

    if (!$match || $match['home_score'] === null) {
        return 0;
    }

    $homeScore = (int) $match['home_score'];
    $awayScore = (int) $match['away_score'];
    $phase = $match['phase'];
    $phasePoints = getPhasePoints($pdo, $phase);

    // Determine actual result
    if ($homeScore > $awayScore) {
        $actualResult = 'home';
    } elseif ($homeScore < $awayScore) {
        $actualResult = 'away';
    } else {
        $actualResult = 'draw';
    }

    // Get all predictions for this match
    $predStmt = $pdo->prepare(
        'SELECT id, user_id, predicted_result, predicted_home_score, predicted_away_score
         FROM q_predictions WHERE match_id = ?'
    );
    $predStmt->execute([$matchId]);
    $predictions = $predStmt->fetchAll();

    $scored = 0;

    foreach ($predictions as $pred) {
        $points = 0;
        $reason = null;

        // Exact score match (only if user actually predicted specific scores)
        if (
            $pred['predicted_home_score'] !== null &&
            $pred['predicted_away_score'] !== null &&
            (int) $pred['predicted_home_score'] === $homeScore &&
            (int) $pred['predicted_away_score'] === $awayScore
        ) {
            $points = $phasePoints['exact'];
            $reason = 'exact_score';
        }
        // Correct result (but not exact score)
        elseif ($pred['predicted_result'] === $actualResult) {
            $points = $phasePoints['correct'];
            $reason = 'correct_result';
        }
        // Wrong prediction: 0 points

        // Update prediction points
        $update = $pdo->prepare(
            'UPDATE q_predictions SET points_earned = ? WHERE id = ?'
        );
        $update->execute([$points, $pred['id']]);

        // Insert scoring log (only for non-zero points) — upsert to handle recalculate
        if ($points > 0 && $reason) {
            $log = $pdo->prepare(
                'INSERT INTO q_scoring_log (match_id, user_id, points_awarded, reason)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   points_awarded = VALUES(points_awarded),
                   reason = VALUES(reason)'
            );
            $log->execute([
                $matchId,
                $pred['user_id'],
                $points,
                $reason,
            ]);
        }

        $scored++;
    }

    return $scored;
}

// --- Reset match scores and predictions (for testing/validation) ---

function handleResetMatch(PDO $pdo, array $input): void {
    $admin = requireAdmin($pdo);
    $matchId = trim((string) ($input['match_id'] ?? ''));

    if ($matchId === '') {
        http_response_code(400);
        echo json_encode(['error' => 'match_id requerido']);
        return;
    }

    $pdo->beginTransaction();

    try {
        // Reset match
        $stmt = $pdo->prepare('UPDATE q_matches SET home_score = NULL, away_score = NULL, status = "scheduled", is_locked = 0 WHERE id = ?');
        $stmt->execute([$matchId]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => "Partido #$matchId no encontrado"]);
            return;
        }

        // Reset points on predictions
        $pdo->prepare('UPDATE q_predictions SET points_earned = 0 WHERE match_id = ?')
            ->execute([$matchId]);

        // Clear scoring log
        $pdo->prepare('DELETE FROM q_scoring_log WHERE match_id = ?')
            ->execute([$matchId]);

        $pdo->commit();
        echo json_encode(['ok' => true, 'message' => "Partido #$matchId reseteado para validacion"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al resetear partido', 'detail' => $e->getMessage()]);
    }
}

// --- Global predictions lock ---

function handleGetConfig(PDO $pdo): void {
    requireAdmin($pdo);
    $stmt = $pdo->prepare("SELECT key_name, value FROM q_config WHERE key_name = 'predictions_locked'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'ok' => true,
        'predictions_locked' => $row ? (bool) ((int) $row['value']) : false,
    ]);
}

function handleToggleLock(PDO $pdo, array $input): void {
    requireAdmin($pdo);
    $locked = isset($input['locked']) ? (int) $input['locked'] : 0;
    $pdo->prepare("INSERT INTO q_config (key_name, value) VALUES ('predictions_locked', ?) ON DUPLICATE KEY UPDATE value = ?")
        ->execute([$locked, $locked]);
    echo json_encode(['ok' => true, 'predictions_locked' => (bool) $locked]);
}

// --- Main routing ---

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$action && isset($input['action'])) {
        $action = $input['action'];
    }

    switch ($action) {
        case 'toggle-phase':
            handleTogglePhase($pdo, $input);
            break;
        case 'set-score':
            handleSetScore($pdo, $input);
            break;
        case 'recalculate':
            handleRecalculate($pdo, $input);
            break;
        case 'reset-pin':
            handleResetPin($pdo, $input);
            break;
        case 'reset-match':
            handleResetMatch($pdo, $input);
            break;
        case 'toggle-lock':
            handleToggleLock($pdo, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Accion POST no valida. Usa: toggle-phase, set-score, recalculate, reset-pin']);
            break;
    }
} elseif ($method === 'GET') {
    switch ($action) {
        case 'participants':
            handleGetParticipants($pdo);
            break;
        case 'phases':
            handleGetPhases($pdo);
            break;
        case 'export':
            handleExport($pdo);
            break;
        case 'export-predictions':
            handleExportPredictions($pdo);
            break;
        case 'config':
            handleGetConfig($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Accion GET no valida. Usa: participants, phases, export, export-predictions']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// --- Action: GET participants ---

function handleGetParticipants(PDO $pdo) {
    requireAdmin($pdo);

    $stmt = $pdo->prepare(
        'SELECT u.id, u.name, u.email, u.email_verified, u.is_admin, u.created_at,
                COUNT(p.id) as predictions_count,
                COALESCE(SUM(p.points_earned), 0) as total_points
         FROM q_users u
         LEFT JOIN q_predictions p ON u.id = p.user_id
         GROUP BY u.id
         ORDER BY total_points DESC, u.created_at ASC'
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $participants = array_map(function ($row) {
        return [
            'id'                => (int) $row['id'],
            'name'              => $row['name'],
            'email'             => $row['email'],
            'email_verified'    => (bool) $row['email_verified'],
            'is_admin'          => (bool) $row['is_admin'],
            'total_points'      => (int) $row['total_points'],
            'predictions_count' => (int) $row['predictions_count'],
            'created_at'        => $row['created_at'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'participants' => $participants, 'count' => count($participants)]);
}

// --- Action: GET phases ---

function handleGetPhases(PDO $pdo) {
    requireAdmin($pdo);

    $stmt = $pdo->prepare(
        'SELECT ph.phase, ph.is_open, ph.opens_at, ph.closes_at,
                COUNT(m.id) as total_matches,
                SUM(CASE WHEN m.status = ? THEN 1 ELSE 0 END) as finished_matches
         FROM q_phases ph
         LEFT JOIN q_matches m ON ph.phase = m.phase
         GROUP BY ph.phase
         ORDER BY FIELD(ph.phase, "groups", "round_of_32", "round_of_16", "quarterfinals", "semifinals", "final")'
    );
    $stmt->execute(['finished']);
    $rows = $stmt->fetchAll();

    $phases = array_map(function ($row) {
        return [
            'phase'            => $row['phase'],
            'is_open'          => (bool) $row['is_open'],
            'opens_at'         => $row['opens_at'],
            'closes_at'        => $row['closes_at'],
            'total_matches'    => (int) $row['total_matches'],
            'finished_matches' => (int) $row['finished_matches'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'phases' => $phases]);
}

// --- Action: POST toggle-phase ---

function handleTogglePhase(PDO $pdo, array $input) {
    requireAdmin($pdo);

    $phase  = trim($input['phase'] ?? '');
    $isOpen = isset($input['is_open']) ? (bool) $input['is_open'] : null;

    $validPhases = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
    if (!in_array($phase, $validPhases)) {
        http_response_code(400);
        echo json_encode(['error' => "Fase invalida: $phase", 'valid' => $validPhases]);
        return;
    }

    if ($isOpen === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere is_open (true/false)']);
        return;
    }

    if ($isOpen) {
        // Opening phase: set opens_at = NOW() if was closed
        $stmt = $pdo->prepare(
            'UPDATE q_phases SET is_open = 1, opens_at = COALESCE(opens_at, NOW()), closes_at = NULL WHERE phase = ?'
        );
    } else {
        // Closing phase: set closes_at = NOW()
        $stmt = $pdo->prepare(
            'UPDATE q_phases SET is_open = 0, closes_at = NOW() WHERE phase = ?'
        );
    }

    $stmt->execute([$phase]);

    // Return updated phase list
    handleGetPhases($pdo);
}

// --- Action: POST set-score ---

function handleSetScore(PDO $pdo, array $input) {
    requireAdmin($pdo);

    $matchId   = (int) ($input['match_id'] ?? 0);
    $homeScore = (int) ($input['home_score'] ?? 0);
    $awayScore = (int) ($input['away_score'] ?? 0);

    if ($matchId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'match_id requerido y valido']);
        return;
    }

    if ($homeScore < 0 || $awayScore < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Scores deben ser no negativos']);
        return;
    }

    // Verify match exists
    $check = $pdo->prepare('SELECT id, status FROM q_matches WHERE id = ?');
    $check->execute([$matchId]);
    if (!$check->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => "Partido #$matchId no encontrado"]);
        return;
    }

    // Update match scores and lock it
    $update = $pdo->prepare(
        'UPDATE q_matches SET home_score = ?, away_score = ?, status = ?, is_locked = 1 WHERE id = ?'
    );
    $update->execute([$homeScore, $awayScore, 'finished', $matchId]);

    // Score all predictions for this match
    $pdo->beginTransaction();
    try {
        $scored = scoreMatchPredictions($pdo, $matchId);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al calcular puntos', 'detail' => $e->getMessage()]);
        return;
    }

    echo json_encode([
        'ok'      => true,
        'scored'  => $scored,
        'message' => "Marcador actualizado y $scored predicciones puntuadas.",
    ]);
}

// --- Action: POST recalculate ---

function handleRecalculate(PDO $pdo, array $input) {
    requireAdmin($pdo);

    $matchId = (int) ($input['match_id'] ?? 0);

    if ($matchId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'match_id requerido y valido']);
        return;
    }

    // Verify match exists and has scores
    $check = $pdo->prepare('SELECT id, home_score, away_score, status FROM q_matches WHERE id = ?');
    $check->execute([$matchId]);
    $match = $check->fetch();

    if (!$match) {
        http_response_code(400);
        echo json_encode(['error' => "Partido #$matchId no encontrado"]);
        return;
    }

    if ($match['home_score'] === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Partido no tiene marcador establecido']);
        return;
    }

    // Re-run scoring (don't change match data)
    $pdo->beginTransaction();
    try {
        $recalculated = scoreMatchPredictions($pdo, $matchId);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al recalcular puntos', 'detail' => $e->getMessage()]);
        return;
    }

    echo json_encode([
        'ok'           => true,
        'recalculated' => $recalculated,
        'message'      => "$recalculated predicciones recalculadas para partido #$matchId.",
    ]);
}

// --- Action: GET export-predictions (CSV backup of ALL predictions) ---

function handleExportPredictions(PDO $pdo) {
    requireAdmin($pdo);

    $phase = $_GET['phase'] ?? 'all';

    $phaseFilter = '';
    $params = [];
    if ($phase !== 'all') {
        $validPhases = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
        if (!in_array($phase, $validPhases)) {
            http_response_code(400);
            echo json_encode(['error' => "Fase invalida: $phase"]);
            return;
        }
        $phaseFilter = ' AND m.phase = ?';
        $params[] = $phase;
    }

    // Full dump: users + predictions + matches + scores
    $sql = "SELECT u.name AS usuario, u.email,
                   m.id AS match_id, m.phase, m.home_team, m.away_team,
                   m.match_date, m.match_time,
                   m.home_score, m.away_score, m.status AS match_status,
                   p.predicted_result, p.predicted_home_score, p.predicted_away_score,
                   p.points_earned,
                   p.created_at AS prediccion_creada
            FROM q_predictions p
            JOIN q_users u ON p.user_id = u.id
            JOIN q_matches m ON p.match_id = m.id
            WHERE 1=1
            $phaseFilter
            ORDER BY u.name, m.match_date, m.match_time";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Output CSV
    $timestamp = date('Y-m-d');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="quiniela-backup-predicciones-' . $timestamp . '.csv"');

    $out = fopen('php://output', 'w');

    // BOM for Excel UTF-8 compatibility
    fwrite($out, "\xEF\xBB\xBF");

    // Headers
    fputcsv($out, [
        'Usuario', 'Email', 'Match ID', 'Fase', 'Local', 'Visita',
        'Fecha Partido', 'Hora Partido', 'Marcador Local', 'Marcador Visita',
        'Estado Partido', 'Prediccion', 'Score Predicho Local', 'Score Predicho Visita',
        'Puntos Ganados', 'Fecha Prediccion'
    ]);

    // Rows
    foreach ($rows as $row) {
        fputcsv($out, [
            $row['usuario'],
            $row['email'],
            $row['match_id'],
            $row['phase'],
            $row['home_team'],
            $row['away_team'],
            $row['match_date'],
            $row['match_time'],
            $row['home_score'] !== null ? (int) $row['home_score'] : '',
            $row['away_score'] !== null ? (int) $row['away_score'] : '',
            $row['match_status'],
            $row['predicted_result'],
            $row['predicted_home_score'] !== null ? (int) $row['predicted_home_score'] : '',
            $row['predicted_away_score'] !== null ? (int) $row['predicted_away_score'] : '',
            (int) $row['points_earned'],
            $row['prediccion_creada'],
        ]);
    }

    fclose($out);
    exit;
}

// --- Action: GET export (CSV) ---

function handleExport(PDO $pdo) {
    requireAdmin($pdo);

    $phase = $_GET['phase'] ?? 'all';

    $phaseFilter = '';
    $params = [];
    if ($phase !== 'all') {
        $validPhases = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
        if (!in_array($phase, $validPhases)) {
            http_response_code(400);
            echo json_encode(['error' => "Fase invalida: $phase"]);
            return;
        }
        $phaseFilter = ' AND m.phase = ?';
        $params[] = $phase;
    }

    $sql = "SELECT u.id, u.name, u.email,
                   COALESCE(SUM(p.points_earned), 0) as total_points,
                   COALESCE(SUM(CASE WHEN sl.reason = 'exact_score' THEN 1 ELSE 0 END), 0) as exact_scores,
                   COALESCE(SUM(CASE WHEN sl.reason IS NOT NULL THEN 1 ELSE 0 END), 0) as correct_results
            FROM q_users u
            LEFT JOIN q_predictions p ON u.id = p.user_id
            LEFT JOIN q_matches m ON p.match_id = m.id
            LEFT JOIN q_scoring_log sl ON p.match_id = sl.match_id AND p.user_id = sl.user_id
            WHERE u.email_verified = 1
            $phaseFilter
            GROUP BY u.id
            ORDER BY total_points DESC, exact_scores DESC, u.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Assign ranks (same logic as leaderboard)
    $leaderboard = [];
    $currentRank = 0;
    $prevPoints  = null;
    $prevExact   = null;

    foreach ($rows as $row) {
        $points = (int) $row['total_points'];
        $exact  = (int) $row['exact_scores'];
        $correct = (int) $row['correct_results'];

        if ($points !== $prevPoints || $exact !== $prevExact) {
            $currentRank++;
        }

        $leaderboard[] = [
            'rank'            => $currentRank,
            'name'            => $row['name'],
            'email'           => $row['email'],
            'total_points'    => $points,
            'exact_scores'    => $exact,
            'correct_results' => $correct,
        ];

        $prevPoints = $points;
        $prevExact  = $exact;
    }

    // Output CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="quiniela-leaderboard-' . ($phase === 'all' ? 'general' : $phase) . '.csv"');

    $out = fopen('php://output', 'w');

    // BOM for Excel UTF-8 compatibility
    fwrite($out, "\xEF\xBB\xBF");

    // Headers
    fputcsv($out, ['Posicion', 'Nombre', 'Email', 'Puntos', 'Marcadores Exactos', 'Resultados Correctos']);

    // Rows
    foreach ($leaderboard as $entry) {
        fputcsv($out, [
            $entry['rank'],
            $entry['name'],
            $entry['email'],
            $entry['total_points'],
            $entry['exact_scores'],
            $entry['correct_results'],
        ]);
    }

    fclose($out);
    exit;
}

// --- Action: POST reset-pin ---

function handleResetPin(PDO $pdo, array $input) {
    requireAdmin($pdo);

    $userId = (int) ($input['user_id'] ?? 0);

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id requerido y valido']);
        return;
    }

    // Verify user exists
    $check = $pdo->prepare('SELECT id, name, email FROM q_users WHERE id = ?');
    $check->execute([$userId]);
    $target = $check->fetch();

    if (!$target) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
        return;
    }

    // Generate new 6-digit PIN and hash it
    $newPin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $hashedPin = password_hash($newPin, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('UPDATE q_users SET pin = ? WHERE id = ?');
    $stmt->execute([$hashedPin, $userId]);

    // Invalidate existing sessions so user must re-login
    $pdo->prepare('DELETE FROM q_sessions WHERE user_id = ?')->execute([$userId]);

    echo json_encode([
        'ok'      => true,
        'message' => "PIN reseteado para {$target['name']}",
        'user'    => $target['name'],
        'email'   => $target['email'],
        'pin'     => $newPin,
    ]);
}
