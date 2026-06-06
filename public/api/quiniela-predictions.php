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
    handleGetPredictions($pdo);
} elseif ($method === 'POST') {
    handlePostPredictions($pdo);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// --- GET: return all predictions for authenticated user ---

function handleGetPredictions(PDO $pdo) {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        return;
    }

    $stmt = $pdo->prepare(
        'SELECT p.match_id, p.predicted_result, p.predicted_home_score, p.predicted_away_score, p.points_earned,
                m.phase, m.group_label, m.home_team, m.away_team, m.match_date, m.match_time,
                m.home_score, m.away_score, m.status, m.is_locked
         FROM q_predictions p
         JOIN q_matches m ON p.match_id = m.id
         WHERE p.user_id = ?
         ORDER BY m.match_date, m.match_time'
    );
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();

    $predictions = array_map(function ($row) {
        return [
            'match_id'            => (string) $row['match_id'],
            'predicted_result'    => $row['predicted_result'],
            'predicted_home_score' => $row['predicted_home_score'] !== null ? (int) $row['predicted_home_score'] : null,
            'predicted_away_score' => $row['predicted_away_score'] !== null ? (int) $row['predicted_away_score'] : null,
            'points_earned'       => (int) $row['points_earned'],
            'phase'               => $row['phase'],
            'group_label'         => $row['group_label'],
            'home_team'           => $row['home_team'],
            'away_team'           => $row['away_team'],
            'match_date'          => $row['match_date'],
            'match_time'          => $row['match_time'],
            'home_score'          => $row['home_score'] !== null ? (int) $row['home_score'] : null,
            'away_score'          => $row['away_score'] !== null ? (int) $row['away_score'] : null,
            'status'              => $row['status'],
            'is_locked'           => (bool) $row['is_locked'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'predictions' => $predictions]);
}

// --- POST: save/update predictions ---

function handlePostPredictions(PDO $pdo) {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['predictions']) || !is_array($input['predictions'])) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalido. Se requiere: {predictions: [...]}']);
        return;
    }

    $validResults = ['home', 'draw', 'away'];
    $saved = [];
    $count = 0;

    // Start transaction
    $pdo->beginTransaction();

    try {
        foreach ($input['predictions'] as $pred) {
            $matchId = trim((string) ($pred['match_id'] ?? ''));
            $result  = trim($pred['predicted_result'] ?? '');
            $homeScore = isset($pred['predicted_home_score']) ? (int) $pred['predicted_home_score'] : null;
            $awayScore = isset($pred['predicted_away_score']) ? (int) $pred['predicted_away_score'] : null;

            if ($matchId === '') {
                http_response_code(400);
                echo json_encode(['error' => 'match_id requerido y valido']);
                $pdo->rollBack();
                return;
            }

            // Validate match exists and is not locked (per-match, not per-phase)
            $matchStmt = $pdo->prepare(
                'SELECT m.id, m.is_locked
                 FROM q_matches m
                 WHERE m.id = ?'
            );
            $matchStmt->execute([$matchId]);
            $match = $matchStmt->fetch();

            if (!$match) {
                http_response_code(400);
                echo json_encode(['error' => "Partido #$matchId no encontrado", 'match_id' => $matchId]);
                $pdo->rollBack();
                return;
            }

            if ((bool) $match['is_locked']) {
                http_response_code(400);
                echo json_encode(['error' => "Partido #$matchId esta bloqueado", 'match_id' => $matchId]);
                $pdo->rollBack();
                return;
            }

            // Validate predicted result
            if (!in_array($result, $validResults)) {
                http_response_code(400);
                echo json_encode(['error' => "Resultado invalido: $result. Usa: home, draw, away", 'match_id' => $matchId]);
                $pdo->rollBack();
                return;
            }

            // Validate scores if provided
            if ($homeScore !== null && $homeScore < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Score local debe ser no negativo', 'match_id' => $matchId]);
                $pdo->rollBack();
                return;
            }
            if ($awayScore !== null && $awayScore < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Score visitante debe ser no negativo', 'match_id' => $matchId]);
                $pdo->rollBack();
                return;
            }

            // UPSERT
            $upsert = $pdo->prepare(
                'INSERT INTO q_predictions (user_id, match_id, predicted_result, predicted_home_score, predicted_away_score, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE
                     predicted_result = VALUES(predicted_result),
                     predicted_home_score = VALUES(predicted_home_score),
                     predicted_away_score = VALUES(predicted_away_score)'
            );
            $upsert->execute([$user['id'], $matchId, $result, $homeScore, $awayScore]);

            $saved[] = [
                'match_id'             => $matchId,
                'predicted_result'     => $result,
                'predicted_home_score' => $homeScore,
                'predicted_away_score' => $awayScore,
            ];
            $count++;
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al guardar predicciones', 'detail' => $e->getMessage()]);
        return;
    }

    echo json_encode(['ok' => true, 'saved' => $count, 'predictions' => $saved]);
}
