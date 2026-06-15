<?php
// ============================================================
// AUTH API — Login, Logout, Check Session
// ============================================================
require_once __DIR__ . '/../config.php';

switch ($method) {
    // POST /api/auth/login
    case 'POST':
        $action = $parts[1] ?? '';
        if ($action === 'login') {
            $body = json_decode(file_get_contents('php://input'), true);
            $email    = trim($body['email'] ?? '');
            $password = trim($body['password'] ?? '');

            if (!$email || !$password) {
                json_response(['error' => 'Email dan password wajib diisi'], 400);
            }

            $result = supabase_auth('token?grant_type=password', [
                'email'    => $email,
                'password' => $password,
            ]);

            if ($result['status'] === 200 && isset($result['data']['access_token'])) {
                json_response([
                    'success'      => true,
                    'access_token' => $result['data']['access_token'],
                    'user'         => [
                        'id'    => $result['data']['user']['id'],
                        'email' => $result['data']['user']['email'],
                        'role'  => $result['data']['user']['user_metadata']['role'] ?? 'admin',
                    ],
                    'expires_in'   => $result['data']['expires_in'],
                ]);
            } else {
                $msg = $result['data']['error_description'] ?? $result['data']['msg'] ?? 'Login gagal';
                json_response(['error' => $msg], 401);
            }
        }

        if ($action === 'logout') {
            $token = get_bearer_token();
            if ($token) {
                $ch = curl_init(SUPABASE_URL . '/auth/v1/logout');
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST           => true,
                    CURLOPT_POSTFIELDS     => '',
                    CURLOPT_HTTPHEADER     => [
                        'apikey: ' . SUPABASE_KEY,
                        'Authorization: Bearer ' . $token,
                    ],
                    CURLOPT_SSL_VERIFYPEER => false,
                ]);
                curl_exec($ch);
                curl_close($ch);
            }
            json_response(['success' => true, 'message' => 'Logout berhasil']);
        }
        break;

    // GET /api/auth/me — cek user yang sedang login
    case 'GET':
        $user = require_auth();
        json_response(['success' => true, 'user' => $user]);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
