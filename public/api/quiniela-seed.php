<?php
/**
 * Quiniela Mundial 2026 - Seed Script
 *
 * Seeds q_matches (100 matches) and q_phases (6 rows) into the database.
 * All match data is hardcoded from the official ESPN schedule.
 *
 * Usage: quiniela-seed.php?key=mundial2026seed
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

define('SEED_KEY', 'mundial2026seed');

// ── Auth check ──────────────────────────────────────────────
if (!isset($_GET['key']) || $_GET['key'] !== SEED_KEY) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing key']);
    exit;
}

// ── Hardcoded match data (100 matches from ESPN schedule) ────
// Format: [id, date, time, homeTeam, awayTeam, groupLabel|null]
// groupLabel is only set for group stage; null for knockout rounds

$matches = [
    // ═══════════════ GROUP STAGE (72 matches) ═══════════════

    // ── Group A ──
    ['760415', '2026-06-11', '2026-06-11 19:00:00', 'Mexico',         'South Africa',       'A'],
    ['760414', '2026-06-12', '2026-06-12 02:00:00', 'South Korea',     'Czechia',            'A'],
    ['760438', '2026-06-18', '2026-06-18 16:00:00', 'Czechia',         'South Africa',       'A'],
    ['760441', '2026-06-19', '2026-06-19 01:00:00', 'Mexico',          'South Korea',        'A'],
    ['760467', '2026-06-25', '2026-06-25 01:00:00', 'Czechia',         'Mexico',             'A'],
    ['760466', '2026-06-25', '2026-06-25 01:00:00', 'South Africa',    'South Korea',        'A'],

    // ── Group B ──
    ['760416', '2026-06-12', '2026-06-12 19:00:00', 'Canada',          'Bosnia-Herzegovina', 'B'],
    ['760420', '2026-06-13', '2026-06-13 19:00:00', 'Qatar',           'Switzerland',        'B'],
    ['760439', '2026-06-18', '2026-06-18 19:00:00', 'Switzerland',     'Bosnia-Herzegovina', 'B'],
    ['760440', '2026-06-18', '2026-06-18 22:00:00', 'Canada',          'Qatar',              'B'],
    ['760462', '2026-06-24', '2026-06-24 19:00:00', 'Bosnia-Herzegovina','Qatar',             'B'],
    ['760463', '2026-06-24', '2026-06-24 19:00:00', 'Switzerland',     'Canada',             'B'],

    // ── Group C ──
    ['760419', '2026-06-13', '2026-06-13 22:00:00', 'Brazil',          'Morocco',            'C'],
    ['760418', '2026-06-14', '2026-06-14 01:00:00', 'Haiti',           'Scotland',           'C'],
    ['760445', '2026-06-19', '2026-06-19 22:00:00', 'Scotland',        'Morocco',            'C'],
    ['760444', '2026-06-20', '2026-06-20 00:30:00', 'Brazil',          'Haiti',              'C'],
    ['760464', '2026-06-24', '2026-06-24 22:00:00', 'Morocco',         'Haiti',              'C'],
    ['760465', '2026-06-24', '2026-06-24 22:00:00', 'Scotland',        'Brazil',             'C'],

    // ── Group D ──
    ['760417', '2026-06-13', '2026-06-13 01:00:00', 'United States',   'Paraguay',           'D'],
    ['760421', '2026-06-14', '2026-06-14 04:00:00', 'Australia',       'Türkiye',            'D'],
    ['760442', '2026-06-19', '2026-06-19 19:00:00', 'United States',   'Australia',          'D'],
    ['760443', '2026-06-20', '2026-06-20 03:00:00', 'Türkiye',         'Paraguay',           'D'],
    ['760469', '2026-06-26', '2026-06-26 02:00:00', 'Paraguay',        'Australia',          'D'],
    ['760470', '2026-06-26', '2026-06-26 02:00:00', 'Türkiye',         'United States',      'D'],

    // ── Group E ──
    ['760422', '2026-06-14', '2026-06-14 17:00:00', 'Germany',         'Curacao',            'E'],
    ['760423', '2026-06-14', '2026-06-14 23:00:00', 'Ivory Coast',     'Ecuador',            'E'],
    ['760448', '2026-06-20', '2026-06-20 20:00:00', 'Germany',         'Ivory Coast',        'E'],
    ['760446', '2026-06-21', '2026-06-21 00:00:00', 'Ecuador',         'Curacao',            'E'],
    ['760473', '2026-06-25', '2026-06-25 20:00:00', 'Curacao',         'Ivory Coast',        'E'],
    ['760468', '2026-06-25', '2026-06-25 20:00:00', 'Ecuador',         'Germany',            'E'],

    // ── Group F ──
    ['760425', '2026-06-14', '2026-06-14 20:00:00', 'Netherlands',    'Japan',              'F'],
    ['760424', '2026-06-15', '2026-06-15 02:00:00', 'Sweden',          'Tunisia',            'F'],
    ['760447', '2026-06-20', '2026-06-20 17:00:00', 'Netherlands',    'Sweden',             'F'],
    ['760449', '2026-06-21', '2026-06-21 04:00:00', 'Tunisia',         'Japan',              'F'],
    ['760471', '2026-06-25', '2026-06-25 23:00:00', 'Japan',           'Sweden',             'F'],
    ['760472', '2026-06-25', '2026-06-25 23:00:00', 'Tunisia',         'Netherlands',       'F'],

    // ── Group G ──
    ['760426', '2026-06-15', '2026-06-15 19:00:00', 'Belgium',         'Egypt',              'G'],
    ['760427', '2026-06-16', '2026-06-16 01:00:00', 'Iran',            'New Zealand',        'G'],
    ['760451', '2026-06-21', '2026-06-21 19:00:00', 'Belgium',         'Iran',               'G'],
    ['760452', '2026-06-22', '2026-06-22 01:00:00', 'New Zealand',     'Egypt',              'G'],
    ['760476', '2026-06-27', '2026-06-27 03:00:00', 'Egypt',           'Iran',               'G'],
    ['760477', '2026-06-27', '2026-06-27 03:00:00', 'New Zealand',     'Belgium',            'G'],

    // ── Group H ──
    ['760428', '2026-06-15', '2026-06-15 16:00:00', 'Spain',           'Cape Verde',         'H'],
    ['760429', '2026-06-15', '2026-06-15 22:00:00', 'Saudi Arabia',    'Uruguay',            'H'],
    ['760453', '2026-06-21', '2026-06-21 16:00:00', 'Spain',           'Saudi Arabia',       'H'],
    ['760450', '2026-06-21', '2026-06-21 22:00:00', 'Uruguay',         'Cape Verde',         'H'],
    ['760478', '2026-06-27', '2026-06-27 00:00:00', 'Cape Verde',      'Saudi Arabia',       'H'],
    ['760479', '2026-06-27', '2026-06-27 00:00:00', 'Uruguay',         'Spain',              'H'],

    // ── Group I ──
    ['760432', '2026-06-16', '2026-06-16 19:00:00', 'France',         'Senegal',            'I'],
    ['760430', '2026-06-16', '2026-06-16 22:00:00', 'Iraq',            'Norway',             'I'],
    ['760457', '2026-06-22', '2026-06-22 21:00:00', 'France',          'Iraq',               'I'],
    ['760454', '2026-06-23', '2026-06-23 00:00:00', 'Norway',          'Senegal',            'I'],
    ['760475', '2026-06-26', '2026-06-26 19:00:00', 'Norway',          'France',             'I'],
    ['760474', '2026-06-26', '2026-06-26 19:00:00', 'Senegal',         'Iraq',               'I'],

    // ── Group J ──
    ['760433', '2026-06-17', '2026-06-17 01:00:00', 'Argentina',       'Algeria',            'J'],
    ['760431', '2026-06-17', '2026-06-17 04:00:00', 'Austria',         'Jordan',             'J'],
    ['760456', '2026-06-22', '2026-06-22 17:00:00', 'Argentina',       'Austria',            'J'],
    ['760455', '2026-06-23', '2026-06-23 03:00:00', 'Jordan',          'Algeria',            'J'],
    ['760484', '2026-06-28', '2026-06-28 02:00:00', 'Algeria',         'Austria',            'J'],
    ['760483', '2026-06-28', '2026-06-28 02:00:00', 'Jordan',          'Argentina',          'J'],

    // ── Group K ──
    ['760435', '2026-06-17', '2026-06-17 17:00:00', 'Portugal',        'Congo DR',           'K'],
    ['760436', '2026-06-18', '2026-06-18 02:00:00', 'Uzbekistan',      'Colombia',           'K'],
    ['760461', '2026-06-23', '2026-06-23 17:00:00', 'Portugal',        'Uzbekistan',         'K'],
    ['760459', '2026-06-24', '2026-06-24 02:00:00', 'Colombia',        'Congo DR',           'K'],
    ['760481', '2026-06-27', '2026-06-27 23:30:00', 'Colombia',        'Portugal',           'K'],
    ['760482', '2026-06-27', '2026-06-27 23:30:00', 'Congo DR',        'Uzbekistan',         'K'],

    // ── Group L ──
    ['760437', '2026-06-17', '2026-06-17 20:00:00', 'England',         'Croatia',            'L'],
    ['760434', '2026-06-17', '2026-06-17 23:00:00', 'Ghana',           'Panama',             'L'],
    ['760458', '2026-06-23', '2026-06-23 20:00:00', 'England',         'Ghana',              'L'],
    ['760460', '2026-06-23', '2026-06-23 23:00:00', 'Panama',          'Croatia',            'L'],
    ['760480', '2026-06-27', '2026-06-27 21:00:00', 'Croatia',         'Ghana',              'L'],
    ['760485', '2026-06-27', '2026-06-27 21:00:00', 'Panama',          'England',            'L'],

    // ═══════════════ ROUND OF 32 (16 matches) ═══════════════
    // homeTeam names contain "Group X Winner/2nd Place"

    ['760486', '2026-06-28', '2026-06-28 19:00:00', 'Group A 2nd Place',                'Group B 2nd Place',                null],
    ['760487', '2026-06-29', '2026-06-29 17:00:00', 'Group C Winner',                   'Group F 2nd Place',                null],
    ['760489', '2026-06-29', '2026-06-29 20:30:00', 'Group E Winner',                   'Third Place Group A/B/C/D/F',      null],
    ['760488', '2026-06-30', '2026-06-30 01:00:00', 'Group F Winner',                   'Group C 2nd Place',                null],
    ['760490', '2026-06-30', '2026-06-30 17:00:00', 'Group E 2nd Place',                'Group I 2nd Place',                null],
    ['760492', '2026-06-30', '2026-06-30 21:00:00', 'Group I Winner',                    'Third Place Group C/D/F/G/H',      null],
    ['760491', '2026-07-01', '2026-07-01 01:00:00', 'Group A Winner',                   'Third Place Group C/E/F/H/I',      null],
    ['760495', '2026-07-01', '2026-07-01 16:00:00', 'Group L Winner',                    'Third Place Group E/H/I/J/K',      null],
    ['760493', '2026-07-01', '2026-07-01 20:00:00', 'Group G Winner',                    'Third Place Group A/E/H/I/J',      null],
    ['760494', '2026-07-02', '2026-07-02 00:00:00', 'Group D Winner',                    'Third Place Group B/E/F/I/J',      null],
    ['760497', '2026-07-02', '2026-07-02 19:00:00', 'Group H Winner',                    'Group J 2nd Place',                null],
    ['760496', '2026-07-02', '2026-07-02 23:00:00', 'Group K 2nd Place',                'Group L 2nd Place',                null],
    ['760498', '2026-07-03', '2026-07-03 03:00:00', 'Group B Winner',                    'Third Place Group E/F/G/I/J',      null],
    ['760499', '2026-07-03', '2026-07-03 18:00:00', 'Group D 2nd Place',                'Group G 2nd Place',                null],
    ['760500', '2026-07-03', '2026-07-03 22:00:00', 'Group J Winner',                    'Group H 2nd Place',                null],
    ['760501', '2026-07-04', '2026-07-04 01:30:00', 'Group K Winner',                    'Third Place Group D/E/I/J/L',      null],

    // ═══════════════ ROUND OF 16 (8 matches) ═══════════════
    // homeTeam names contain "Round of 32 X Winner"

    ['760502', '2026-07-04', '2026-07-04 17:00:00', 'Round of 32 1 Winner',               'Round of 32 3 Winner',               null],
    ['760503', '2026-07-04', '2026-07-04 21:00:00', 'Round of 32 2 Winner',               'Round of 32 5 Winner',               null],
    ['760504', '2026-07-05', '2026-07-05 20:00:00', 'Round of 32 4 Winner',               'Round of 32 6 Winner',               null],
    ['760505', '2026-07-06', '2026-07-06 00:00:00', 'Round of 32 7 Winner',               'Round of 32 8 Winner',               null],
    ['760506', '2026-07-06', '2026-07-06 19:00:00', 'Round of 32 11 Winner',              'Round of 32 12 Winner',              null],
    ['760507', '2026-07-07', '2026-07-07 00:00:00', 'Round of 32 9 Winner',               'Round of 32 10 Winner',              null],
    ['760509', '2026-07-07', '2026-07-07 16:00:00', 'Round of 32 14 Winner',              'Round of 32 16 Winner',              null],
    ['760508', '2026-07-07', '2026-07-07 20:00:00', 'Round of 32 13 Winner',              'Round of 32 15 Winner',              null],

    // ═══════════════ QUARTERFINALS (2 matches) ═══════════════
    // "Round of 16" in name, dates 2026-07-09 / 2026-07-10

    ['760510', '2026-07-09', '2026-07-09 20:00:00', 'Round of 16 1 Winner',               'Round of 16 2 Winner',               null],
    ['760511', '2026-07-10', '2026-07-10 19:00:00', 'Round of 16 5 Winner',               'Round of 16 6 Winner',               null],

    // ═══════════════ SEMIFINALS (1 match) ═══════════════
    // "Round of 16" in name, date 2026-07-11

    ['760512', '2026-07-11', '2026-07-11 21:00:00', 'Round of 16 3 Winner',               'Round of 16 4 Winner',               null],

    // ═══════════════ FINAL (1 match) ═══════════════
    // "Round of 16" in name, date 2026-07-12

    ['760513', '2026-07-12', '2026-07-12 01:00:00', 'Round of 16 7 Winner',               'Round of 16 8 Winner',               null],
];

// ── Phase determination logic ─────────────────────────────────
function determinePhase(string $homeTeam, string $date): string {
    // Group stage: has group_label (checked via caller)
    // This function is only called for knockout rounds
    if (strpos($homeTeam, 'Group') !== false) {
        return 'round_of_32';
    }
    if (strpos($homeTeam, 'Round of 32') !== false) {
        return 'round_of_16';
    }
    if (strpos($homeTeam, 'Round of 16') !== false) {
        if ($date === '2026-07-09' || $date === '2026-07-10') {
            return 'quarterfinals';
        }
        if ($date === '2026-07-11') {
            return 'semifinals';
        }
        if ($date === '2026-07-12') {
            return 'final';
        }
    }
    return 'groups'; // fallback
}

// ── Seed q_matches ──────────────────────────────────────────
try {
    $pdo->beginTransaction();

    // Clear existing data
    $pdo->exec('DELETE FROM q_matches');
    $pdo->exec('DELETE FROM q_phases');

    $stmt = $pdo->prepare(
        'INSERT INTO q_matches (id, phase, group_label, home_team, away_team, match_date, match_time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $count = 0;
    foreach ($matches as $m) {
        [$id, $date, $time, $home, $away, $groupLabel] = $m;

        // Determine phase
        if ($groupLabel !== null) {
            $phase = 'groups';
        } else {
            $phase = determinePhase($home, $date);
        }

        $stmt->execute([
            $id,
            $phase,
            $groupLabel,
            $home,
            $away,
            $date,
            $time,
            'scheduled'
        ]);
        $count++;
    }

    // ── Seed q_phases ────────────────────────────────────────
    $phasesStmt = $pdo->prepare(
        'INSERT INTO q_phases (phase, is_open, opens_at, closes_at)
         VALUES (?, ?, ?, ?)'
    );

    $phases = [
        ['groups',       0, '2026-06-05 00:00:00', null],
        ['round_of_32',  0, null,                    null],
        ['round_of_16',  0, null,                    null],
        ['quarterfinals',0, null,                    null],
        ['semifinals',   0, null,                    null],
        ['final',        0, null,                    null],
    ];

    $phaseCount = 0;
    foreach ($phases as $p) {
        $phasesStmt->execute($p);
        $phaseCount++;
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Seed completed successfully',
        'matches_seeded' => $count,
        'phases_seeded'  => $phaseCount,
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
    ]);
}
