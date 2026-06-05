<?php
/**
 * One-time script: Reset admin PIN for Gil
 * Run this ONCE then DELETE from server.
 * Access: /api/quiniela-fix-admin.php
 */
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

$newPin = '670522';
$hashedPin = password_hash($newPin, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('UPDATE q_users SET pin = ? WHERE email = ?');
$stmt->execute([$hashedPin, 'gil@admin.com']);

if ($stmt->rowCount() > 0) {
    echo json_encode([
        'ok' => true,
        'message' => 'PIN actualizado correctamente',
        'email' => 'gil@admin.com',
        'pin' => $newPin,
        'hash_preview' => substr($hashedPin, 0, 20) . '...'
    ]);
} else {
    echo json_encode([
        'ok' => false,
        'error' => 'Usuario no encontrado. Verifica que gil@admin.com existe en q_users.'
    ]);
}
