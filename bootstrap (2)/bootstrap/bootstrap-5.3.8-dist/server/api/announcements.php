<?php
// ============================================================
// ANNOUNCEMENTS API — CRUD Pengumuman/Berita
// Tanpa Cloudinary: gambar diisi via URL langsung
// ============================================================
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // GET /api/announcements — ambil pengumuman aktif (publik)
    case 'GET':
        $limit    = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
        $endpoint = "announcements?is_active=eq.true&order=created_at.desc&limit={$limit}&select=*";
        $result   = supabase_request($endpoint);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // POST /api/announcements — tambah pengumuman (admin only)
    case 'POST':
        $user = require_auth();
        $body = json_decode(file_get_contents('php://input'), true);

        $title      = trim($body['title'] ?? '');
        $content    = trim($body['content'] ?? '');
        $image_url  = trim($body['image_url'] ?? '');
        $link_url   = trim($body['link_url'] ?? '');
        $link_label = trim($body['link_label'] ?? 'Daftar Sekarang');
        $is_active  = isset($body['is_active']) ? (bool)$body['is_active'] : true;

        if (!$title || !$content) {
            json_response(['error' => 'Judul dan isi pengumuman wajib diisi'], 400);
        }

        $insert = supabase_request('announcements', 'POST', [
            'title'      => $title,
            'content'    => $content,
            'image_url'  => $image_url ?: null,
            'link_url'   => $link_url  ?: null,
            'link_label' => $link_label,
            'is_active'  => $is_active,
            'created_by' => $user['email'] ?? 'admin',
        ], true);

        json_response(['success' => true, 'data' => $insert['data']]);
        break;

    // PATCH /api/announcements?id=xxx — edit pengumuman (admin only)
    case 'PATCH':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);

        $body = json_decode(file_get_contents('php://input'), true);
        $update = [
            'title'      => trim($body['title'] ?? ''),
            'content'    => trim($body['content'] ?? ''),
            'image_url'  => trim($body['image_url'] ?? '') ?: null,
            'link_url'   => trim($body['link_url'] ?? '') ?: null,
            'link_label' => trim($body['link_label'] ?? 'Daftar Sekarang'),
            'is_active'  => isset($body['is_active']) ? (bool)$body['is_active'] : true,
            'updated_at' => date('c'),
        ];

        $result = supabase_request("announcements?id=eq.{$id}", 'PATCH', $update, true);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // DELETE /api/announcements?id=xxx — hapus pengumuman (admin only)
    case 'DELETE':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);

        supabase_request("announcements?id=eq.{$id}", 'DELETE', [], true);
        json_response(['success' => true, 'message' => 'Pengumuman berhasil dihapus']);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
