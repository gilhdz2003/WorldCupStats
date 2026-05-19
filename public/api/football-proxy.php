<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/football-config.php';

if (!defined('FOOTBALL_API_KEY') || empty(FOOTBALL_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$endpoint = $_GET['endpoint'] ?? '';

if (empty($endpoint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing endpoint parameter']);
    exit;
}

$allowed = [
    '/fixtures',
    '/fixtures/events',
    '/fixtures/statistics',
    '/fixtures/lineups',
    '/teams',
    '/players',
    '/standings',
    '/leagues',
    '/teams/statistics',
    '/fixtures/headtohead',
    '/countries',
    '/odds',
];

$matched = false;
foreach ($allowed as $prefix) {
    if (str_starts_with($endpoint, $prefix)) {
        $matched = true;
        break;
    }
}

if (!$matched) {
    http_response_code(403);
    echo json_encode(['error' => 'Endpoint not allowed']);
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/mundial2026_rate_' . md5($ip) . '.json';
$now = time();
$requests = [];

if (file_exists($rateFile)) {
    $data = file_get_contents($rateFile);
    $requests = json_decode($data, true) ?? [];
    $requests = array_filter($requests, function($t) use ($now) {
        return ($now - $t) < 60;
    });
}

if (count($requests) >= 60) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$requests[] = $now;
file_put_contents($rateFile, json_encode(array_values($requests)));

$queryString = $_SERVER['QUERY_STRING'];
$queryString = preg_replace('/^endpoint=[^&]*&?/', '', $queryString);
$apiUrl = 'https://v3.football.api-sports.io' . $endpoint;
if (!empty($queryString)) {
    $apiUrl .= '?' . $queryString;
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'x-apisports-key: ' . FOOTBALL_API_KEY,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'Upstream request failed']);
    exit;
}

http_response_code($httpCode);
echo $response;
