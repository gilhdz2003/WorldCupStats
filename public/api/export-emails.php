<?php
// TEMPORAL — Ejecutar una vez y BORRAR
require_once __DIR__ . '/config.php';

$stmt = $pdo->query("SELECT name, email FROM q_users ORDER BY name ASC");
$users = $stmt->fetchAll();

header('Content-Type: text/plain; charset=utf-8');

echo "=== PARTICIPANTES QUINIELA MUNDIAL 2026 ===\n";
echo "Total: " . count($users) . "\n\n";

foreach ($users as $u) {
    echo $u['email'] . "\n";
}

echo "\n=== CON NOMBRES ===\n\n";
foreach ($users as $u) {
    echo "{$u['name']} <{$u['email']}>\n";
}
