<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/football-config.php';

// Try alternative names + search for missing teams
$lookups = [
    ['search' => 'Czech', 'label' => 'Czechia'],
    ['search' => 'Bosnia', 'label' => 'Bosnia-Herzegovina'],
    ['search' => 'Turkiye', 'label' => 'Turkey/Turkiye'],
    ['search' => 'Ivoire', 'label' => 'Ivory Coast'],
    ['search' => 'Curacao', 'label' => 'Curacao'],
    ['search' => 'Sweden', 'label' => 'Sweden'],
    ['search' => 'Egypt', 'label' => 'Egypt'],
    ['search' => 'Zealand', 'label' => 'New Zealand'],
    ['search' => 'Cape Verde', 'label' => 'Cape Verde'],
    ['search' => 'Norway', 'label' => 'Norway'],
    ['search' => 'Iraq', 'label' => 'Iraq'],
    ['search' => 'Austria', 'label' => 'Austria'],
    ['search' => 'Algeria', 'label' => 'Algeria'],
    ['search' => 'Jordan', 'label' => 'Jordan'],
    ['search' => 'Uzbekistan', 'label' => 'Uzbekistan'],
    ['search' => 'Congo', 'label' => 'DR Congo'],
    ['search' => 'Panama', 'label' => 'Panama'],
];

foreach ($lookups as $item) {
    $url = 'https://v3.football.api-sports.io/teams?search=' . urlencode($item['search']);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'x-apisports-key: ' . FOOTBALL_API_KEY,
        ],
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    echo "=== " . $item['label'] . " ===\n";

    if (!empty($data['response'])) {
        $nationals = [];
        foreach ($data['response'] as $team) {
            if (!empty($team['team']['national'])) {
                $nationals[] = $team;
            }
        }
        if (count($nationals) > 0) {
            foreach ($nationals as $team) {
                echo "  NATIONAL: ID=" . $team['team']['id'] . " | " . $team['team']['name'] . " | " . $team['team']['code'] . "\n";
            }
        } else {
            echo "  No national team found. First 3 results:\n";
            for ($i = 0; $i < min(3, count($data['response'])); $i++) {
                $t = $data['response'][$i]['team'];
                echo "    ID=" . $t['id'] . " | " . $t['name'] . " | " . ($t['national'] ? 'NAT' : 'CLUB') . "\n";
            }
        }
        echo "  Total results: " . count($data['response']) . "\n";
    } else {
        echo "  (no results)\n";
    }
    echo "\n";
    sleep(1);
}
