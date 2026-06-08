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

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$action && isset($input['action'])) {
        $action = $input['action'];
    }

    switch ($action) {
        case 'register':
            handleRegister($pdo, $input);
            break;
        case 'verify':
            handleVerify($pdo, $input);
            break;
        case 'login':
            handleLogin($pdo, $input);
            break;
        case 'logout':
            handleLogout($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Accion no valida. Usa: register, verify, login, logout']);
            break;
    }
} elseif ($method === 'GET' && $action === 'me') {
    handleMe($pdo);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
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

// --- Action handlers ---

function handleRegister(PDO $pdo, array $input) {
    // Check registration lock (admin switch)
    $lockStmt = $pdo->prepare("SELECT value FROM q_config WHERE key_name = 'registration_locked'");
    $lockStmt->execute();
    $lockRow = $lockStmt->fetch(PDO::FETCH_ASSOC);
    if ($lockRow && (int) $lockRow['value'] === 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Los registros están cerrados temporalmente']);
        return;
    }

    $name  = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');

    if (!$name || mb_strlen($name) < 1 || mb_strlen($name) > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre requerido (1-100 caracteres)']);
        return;
    }

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email invalido']);
        return;
    }

    // Check if already registered
    $check = $pdo->prepare('SELECT id FROM q_users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ya esta registrado']);
        return;
    }

    // Generate 6-digit PIN
    $pin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $hashedPin = password_hash($pin, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO q_users (name, email, pin, email_verified, created_at)
         VALUES (?, ?, ?, 1, NOW())'
    );
    $stmt->execute([$name, $email, $hashedPin]);

    // Send email (disabled for simplified flow)
    // $mailBody = "Tu PIN (guardalo para iniciar sesion): $pin";
    // $mailSent = mail($email, "Quiniela Mundial 2026 - Tu PIN", $mailBody, "From: noreply@mundial2026.com");

    echo json_encode([
        'ok'      => true,
        'message' => 'Registro exitoso. Guarda tu PIN.',
        'pin'     => $pin,
    ]);
}

function handleVerify(PDO $pdo, array $input) {
    // Email verification not required for this tournament
    echo json_encode([
        'ok'      => true,
        'message' => 'La verificacion de email no es necesaria para este torneo. Tu cuenta ya esta lista.',
    ]);
}

function handleLogin(PDO $pdo, array $input) {
    $email = trim($input['email'] ?? '');
    $pin   = trim($input['pin'] ?? '');

    if (!$email || !$pin) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y PIN requeridos']);
        return;
    }

    $stmt = $pdo->prepare('SELECT id, name, email, pin, is_admin, email_verified FROM q_users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
        return;
    }

    if (!password_verify($pin, $user['pin'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
        return;
    }

    // Generate session token (32 random bytes hex)
    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = (new DateTime('now', new DateTimeZone('UTC')))->modify('+30 days')->format('Y-m-d H:i:s');

    $sessionStmt = $pdo->prepare(
        'INSERT INTO q_sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())'
    );
    $sessionStmt->execute([$user['id'], $tokenHash, $expiresAt]);

    // Update last login
    $pdo->prepare('UPDATE q_users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

    echo json_encode([
        'ok'   => true,
        'user' => [
            'id'           => (int) $user['id'],
            'name'         => $user['name'],
            'email'        => $user['email'],
            'is_admin'     => (bool) $user['is_admin'],
        ],
        'token' => $token,
    ]);
}

function handleLogout(PDO $pdo) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token no proporcionado']);
        return;
    }

    $tokenHash = hash('sha256', $matches[1]);
    $stmt = $pdo->prepare('DELETE FROM q_sessions WHERE token_hash = ?');
    $stmt->execute([$tokenHash]);

    echo json_encode(['ok' => true]);
}

function handleMe(PDO $pdo) {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        return;
    }

    echo json_encode([
        'ok'   => true,
        'user' => [
            'id'       => (int) $user['id'],
            'name'     => $user['name'],
            'email'    => $user['email'],
            'is_admin' => (bool) $user['is_admin'],
        ],
    ]);
}
