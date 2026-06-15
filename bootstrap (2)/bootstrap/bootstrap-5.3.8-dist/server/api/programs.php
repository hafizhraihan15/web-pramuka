<?php
// ============================================================
// PROGRAMS API — CRUD Program Kerja
// ============================================================
require_once __DIR__ . '/../config.php';

switch ($method) {

    // GET /api/programs
    case 'GET':
        $category = $_GET['category'] ?? '';
        $endpoint = 'programs?order=sort_order.asc,created_at.desc&select=*';
        if ($category && $category !== 'all') {
            $endpoint .= '&category=eq.' . urlencode($category);
        }
        $result = supabase_request($endpoint);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // POST /api/programs — tambah program baru (admin)
    case 'POST':
        $user = require_auth();
        $body = json_decode(file_get_contents('php://input'), true);

        $required = ['title', 'category', 'description'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                json_response(['error' => "Field '{$field}' wajib diisi"], 400);
            }
        }

        $insert = supabase_request('programs', 'POST', [
            'title'       => $body['title'],
            'category'    => $body['category'],
            'description' => $body['description'],
            'schedule'    => $body['schedule'] ?? '',
            'icon'        => $body['icon'] ?? '🏕️',
            'color'       => $body['color'] ?? '#001f3f',
            'sort_order'  => (int)($body['sort_order'] ?? 99),
            'is_active'   => $body['is_active'] ?? true,
        ]);

        json_response(['success' => true, 'data' => $insert['data']]);
        break;

    // PUT /api/programs?id=xxx — update program (admin)
    case 'PUT':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);

        $body   = json_decode(file_get_contents('php://input'), true);
        $result = supabase_request('programs?id=eq.' . $id, 'PATCH', $body, true);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // DELETE /api/programs?id=xxx — hapus program (admin)
    case 'DELETE':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID wajib diisi'], 400);

        supabase_request('programs?id=eq.' . $id, 'DELETE', [], true);
        json_response(['success' => true, 'message' => 'Program berhasil dihapus']);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
