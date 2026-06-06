<?php
/**
 * Quiniela Auto-Scoring Cron
 *
 * Call via cron-job.org every 5 minutes during the tournament.
 * URL: https://mundial2026.com/api/quiniela-cron.php
 *
 * This script:
 * 1. Fetches the ESPN scoreboard for FIFA World Cup
 * 2. Finds matches that are STATUS_FULL_TIME but not yet scored in q_matches
 * 3. Updates match scores and locks them
 * 4. Calculates points for all predictions on those matches
 * 5. Logs results to q_scoring_log
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$scored = 0;
$matches_updated = 0;
$log = [];

try {
    // Fetch ESPN scoreboard
    $ctx = stream_context_create([
        'http' => ['timeout' => 15, 'ignore_errors' => true],
        'https' => ['timeout' => 15]
    ]);
    $espnJson = @file_get_contents('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard', false, $ctx);

    if ($espnJson === false) {
        echo json_encode(['ok' => false, 'error' => 'ESPN fetch failed']);
        exit;
    }

    $espnData = json_decode($espnJson, true);
    if (!$espnData || !isset($espnData['events'])) {
        echo json_encode(['ok' => true, 'message' => 'No ESPN events found', 'scored' => 0]);
        exit;
    }

    $pdo->beginTransaction();

// Helper: get phase-specific point values
function getPhasePoints(PDO $pdo, string $phase): array {
    $stmt = $pdo->prepare('SELECT points_correct, points_exact FROM q_phases WHERE phase = ?');
    $stmt->execute([$phase]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return [
        'correct' => (int) ($row['points_correct'] ?? 3),
        'exact'   => (int) ($row['points_exact'] ?? 5),
    ];
}

    foreach ($espnData['events'] as $event) {
        $espnId = (string) $event['id'];

        // Find match in our DB by ESPN ID (stored in a lookup or by competition ID)
        // ESPN events have competitions with competitors
        $competitions = $event['competitions'] ?? [];
        foreach ($competitions as $comp) {
            $matchId = (string) $comp['id'];
            $status = $comp['status']['type']['name'] ?? '';

            // Only process full-time matches
            if ($status !== 'STATUS_FULL_TIME') continue;

            // Check if this match is already scored
            $stmt = $pdo->prepare('SELECT id, home_score, away_score, status FROM q_matches WHERE id = ?');
            $stmt->execute([$matchId]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$match) continue;
            if ($match['status'] === 'finished') continue; // Already scored

            // Get scores from ESPN
            $competitors = $comp['competitors'] ?? [];
            $homeScore = null;
            $awayScore = null;

            foreach ($competitors as $competitor) {
                $score = (int) ($competitor['score'] ?? 0);
                if ($competitor['homeAway'] === 'home') {
                    $homeScore = $score;
                } else {
                    $awayScore = $score;
                }
            }

            if ($homeScore === null || $awayScore === null) continue;

            // Update match
            $update = $pdo->prepare('UPDATE q_matches SET home_score = ?, away_score = ?, status = ?, is_locked = 1 WHERE id = ?');
            $update->execute([$homeScore, $awayScore, 'finished', $matchId]);
            $matches_updated++;

            // Determine actual result
            if ($homeScore > $awayScore) {
                $actualResult = 'home';
            } elseif ($homeScore < $awayScore) {
                $actualResult = 'away';
            } else {
                $actualResult = 'draw';
            }

            // Get match phase for escalating points
            $phaseStmt = $pdo->prepare('SELECT phase FROM q_matches WHERE id = ?');
            $phaseStmt->execute([$matchId]);
            $matchRow = $phaseStmt->fetch(PDO::FETCH_ASSOC);
            $matchPhase = $matchRow ? $matchRow['phase'] : 'groups';
            $phasePoints = getPhasePoints($pdo, $matchPhase);

            // Calculate points for all predictions on this match
            $predStmt = $pdo->prepare('SELECT id, user_id, predicted_result, predicted_home_score, predicted_away_score FROM q_predictions WHERE match_id = ?');
            $predStmt->execute([$matchId]);
            $predictions = $predStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($predictions as $pred) {
                $points = 0;
                $reason = null;

                // Check exact score first
                if ($pred['predicted_home_score'] !== null && $pred['predicted_away_score'] !== null
                    && (int) $pred['predicted_home_score'] === $homeScore
                    && (int) $pred['predicted_away_score'] === $awayScore) {
                    $points = $phasePoints['exact'];
                    $reason = 'exact_score';
                } elseif ($pred['predicted_result'] === $actualResult) {
                    $points = $phasePoints['correct'];
                    $reason = 'correct_result';
                }

                // Update prediction points
                $upPred = $pdo->prepare('UPDATE q_predictions SET points_earned = ? WHERE id = ?');
                $upPred->execute([$points, $pred['id']]);

                // Log scoring
                if ($points > 0) {
                    $logStmt = $pdo->prepare('INSERT INTO q_scoring_log (match_id, user_id, points_awarded, reason) VALUES (?, ?, ?, ?)');
                    $logStmt->execute([$matchId, $pred['user_id'], $points, $reason]);
                    $scored++;
                }
            }

            $log[] = "Match $matchId: $homeScore-$awayScore ($actualResult), " . count($predictions) . " predictions scored";
        }
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'matches_updated' => $matches_updated,
        'predictions_scored' => $scored,
        'timestamp' => date('Y-m-d H:i:s'),
        'log' => $log
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
