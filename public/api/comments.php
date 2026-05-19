<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGet($pdo);
} elseif ($method === 'POST') {
    handlePost($pdo);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function handleGet(PDO $pdo) {
    $thread = $_GET['thread'] ?? '';
    if (!$thread || !preg_match('/^[a-zA-Z0-9_-]+$/', $thread)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid thread ID']);
        return;
    }

    $stmt = $pdo->prepare(
        'SELECT id, author, message, created_at FROM comments WHERE thread_id = ? ORDER BY created_at DESC LIMIT 200'
    );
    $stmt->execute([$thread]);
    $comments = $stmt->fetchAll();

    echo json_encode(array_map(function ($c) {
        return [
            'id' => (int) $c['id'],
            'author' => $c['author'],
            'message' => $c['message'],
            'timestamp' => $c['created_at'],
        ];
    }, $comments));
}

function handlePost(PDO $pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    $thread = trim($input['thread_id'] ?? '');
    $author = trim($input['author'] ?? '');
    $message = trim($input['message'] ?? '');

    if (!$thread || !preg_match('/^[a-zA-Z0-9_-]+$/', $thread)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid thread ID']);
        return;
    }
    if (!$author || mb_strlen($author) > 50) {
        http_response_code(400);
        echo json_encode(['error' => 'Author name required (max 50 chars)']);
        return;
    }
    if (!$message || mb_strlen($message) > 500) {
        http_response_code(400);
        echo json_encode(['error' => 'Message required (max 500 chars)']);
        return;
    }

    // Rate limit: max 5 comments per minute per IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateStmt = $pdo->prepare(
        'SELECT COUNT(*) FROM comments WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)'
    );
    $rateStmt->execute([$ip]);
    if ($rateStmt->fetchColumn() >= 5) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded. Wait a moment.']);
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO comments (thread_id, author, message, ip_address) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$thread, htmlspecialchars($author, ENT_QUOTES, 'UTF-8'), htmlspecialchars($message, ENT_QUOTES, 'UTF-8'), $ip]);

    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'ok' => true]);
}
