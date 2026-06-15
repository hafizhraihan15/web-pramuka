<?php
// ============================================================
// KONFIGURASI API — ISI SESUAI AKUN KAMU
// ============================================================

// --- SUPABASE ---
define('SUPABASE_URL',     'https://YOUR_PROJECT_ID.supabase.co');
define('SUPABASE_KEY',     'YOUR_SUPABASE_ANON_KEY');
define('SUPABASE_SERVICE_KEY', 'YOUR_SUPABASE_SERVICE_ROLE_KEY');

// --- CLOUDINARY ---
define('CLOUDINARY_CLOUD_NAME', 'YOUR_CLOUD_NAME');
define('CLOUDINARY_API_KEY',    'YOUR_CLOUDINARY_API_KEY');
define('CLOUDINARY_API_SECRET', 'YOUR_CLOUDINARY_API_SECRET');
define('CLOUDINARY_UPLOAD_PRESET', 'pramuka_inhil');

// --- APP ---
define('APP_NAME', 'Pramuka MAN 1 INHIL');
define('ADMIN_EMAIL', 'admin@pramukainhi.id');
define('APP_URL', 'http://localhost'); // Ganti sesuai domain

// --- SESSION ---
define('SESSION_LIFETIME', 3600 * 8); // 8 jam

// ============================================================
// HEADER CORS & JSON
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function supabase_request(string $endpoint, string $method = 'GET', array $body = [], bool $useServiceKey = false): array {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $key = $useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_KEY;

    $ch = curl_init($url);
    $headers = [
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json',
        'Prefer: return=representation',
    ];

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } elseif (in_array($method, ['PUT', 'PATCH', 'DELETE'])) {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if (!empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
    }

    $response  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true) ?? [];
    return ['data' => $data, 'status' => $httpCode];
}

function supabase_auth(string $endpoint, array $body): array {
    $url = SUPABASE_URL . '/auth/v1/' . $endpoint;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_HTTPHEADER     => [
            'apikey: ' . SUPABASE_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['data' => json_decode($response, true), 'status' => $status];
}

function json_response(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function get_bearer_token(): ?string {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $parts = explode(' ', $headers['Authorization']);
        return $parts[1] ?? null;
    }
    return null;
}

function verify_token(string $token): ?array {
    $result = supabase_request('', 'GET', [], false);
    // Verify via Supabase auth
    $ch = curl_init(SUPABASE_URL . '/auth/v1/user');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'apikey: ' . SUPABASE_KEY,
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status === 200) {
        return json_decode($response, true);
    }
    return null;
}

function require_auth(): array {
    $token = get_bearer_token();
    if (!$token) {
        json_response(['error' => 'Unauthorized: No token provided'], 401);
    }
    $user = verify_token($token);
    if (!$user) {
        json_response(['error' => 'Unauthorized: Invalid or expired token'], 401);
    }
    return $user;
}
