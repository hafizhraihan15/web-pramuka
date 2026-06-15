<?php
// ============================================================
// MESSAGES API — Form Kontak
// ============================================================
require_once __DIR__ . '/../config.php';

switch ($method) {

    // POST /api/messages — kirim pesan dari form kontak (publik)
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);

        $name    = htmlspecialchars(trim($body['name'] ?? ''));
        $email   = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
        $subject = htmlspecialchars(trim($body['subject'] ?? 'Pesan dari Website'));
        $message = htmlspecialchars(trim($body['message'] ?? ''));

        if (!$name || !$email || !$message) {
            json_response(['error' => 'Nama, email, dan pesan wajib diisi'], 400);
        }

        $insert = supabase_request('messages', 'POST', [
            'name'    => $name,
            'email'   => $email,
            'subject' => $subject,
            'message' => $message,
            'is_read' => false,
            'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
        ]);

        if ($insert['status'] >= 400) {
            json_response(['error' => 'Gagal menyimpan pesan'], 500);
        }

        json_response(['success' => true, 'message' => 'Pesan berhasil terkirim! Kami akan segera merespons.']);
        break;

    // GET /api/messages — ambil semua pesan (admin only)
    case 'GET':
        $user   = require_auth();
        $result = supabase_request('messages?order=created_at.desc&select=*', 'GET', [], true);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // PATCH /api/messages?id=xxx — tandai sudah dibaca (admin)
    case 'PATCH':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);
        supabase_request('messages?id=eq.' . $id, 'PATCH', ['is_read' => true], true);
        json_response(['success' => true]);
        break;

    // DELETE /api/messages?id=xxx — hapus pesan (admin)
    case 'DELETE':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);
        supabase_request('messages?id=eq.' . $id, 'DELETE', [], true);
        json_response(['success' => true, 'message' => 'Pesan dihapus']);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
