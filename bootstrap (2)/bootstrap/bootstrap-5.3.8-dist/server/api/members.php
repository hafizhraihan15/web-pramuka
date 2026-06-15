<?php
// ============================================================
// MEMBERS API — Pendaftaran Anggota
// ============================================================
require_once __DIR__ . '/../config.php';

switch ($method) {

    // POST /api/members — daftar anggota baru (publik)
    case 'POST':
        $name       = htmlspecialchars(trim($_POST['name'] ?? ''));
        $nis        = htmlspecialchars(trim($_POST['nis'] ?? ''));
        $class      = htmlspecialchars(trim($_POST['class'] ?? ''));
        $phone      = htmlspecialchars(trim($_POST['phone'] ?? ''));
        $address    = htmlspecialchars(trim($_POST['address'] ?? ''));
        $motivation = htmlspecialchars(trim($_POST['motivation'] ?? ''));

        if (!$name || !$nis || !$class) {
            json_response(['error' => 'Nama, NIS, dan kelas wajib diisi'], 400);
        }

        // Upload foto KTP/profil ke Cloudinary jika ada
        $photoUrl = '';
        if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
            $file     = $_FILES['photo'];
            $folder   = 'pramuka_inhil/members';
            $timestamp = time();
            $sig      = sha1("folder={$folder}&timestamp={$timestamp}" . CLOUDINARY_API_SECRET);

            $ch = curl_init('https://api.cloudinary.com/v1_1/' . CLOUDINARY_CLOUD_NAME . '/image/upload');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => [
                    'file'      => new CURLFile($file['tmp_name'], $file['type'], $file['name']),
                    'api_key'   => CLOUDINARY_API_KEY,
                    'timestamp' => $timestamp,
                    'signature' => $sig,
                    'folder'    => $folder,
                ],
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $resp = json_decode(curl_exec($ch), true);
            curl_close($ch);
            $photoUrl = $resp['secure_url'] ?? '';
        }

        $insert = supabase_request('members', 'POST', [
            'name'       => $name,
            'nis'        => $nis,
            'class'      => $class,
            'phone'      => $phone,
            'address'    => $address,
            'motivation' => $motivation,
            'photo_url'  => $photoUrl,
            'status'     => 'pending',
        ]);

        json_response([
            'success' => true,
            'message' => 'Pendaftaran berhasil! Tunggu konfirmasi dari admin.',
            'data'    => $insert['data'],
        ]);
        break;

    // GET /api/members — daftar anggota (admin)
    case 'GET':
        $user   = require_auth();
        $status = $_GET['status'] ?? '';
        $ep     = 'members?order=created_at.desc&select=*';
        if ($status) $ep .= '&status=eq.' . urlencode($status);
        $result = supabase_request($ep, 'GET', [], true);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // PATCH /api/members?id=xxx — update status anggota (admin: accept/reject)
    case 'PATCH':
        $user   = require_auth();
        $id     = $_GET['id'] ?? '';
        $body   = json_decode(file_get_contents('php://input'), true);
        $status = $body['status'] ?? '';
        if (!$id || !in_array($status, ['accepted', 'rejected', 'pending'])) {
            json_response(['error' => 'ID dan status valid diperlukan'], 400);
        }
        supabase_request('members?id=eq.' . $id, 'PATCH', ['status' => $status], true);
        json_response(['success' => true, 'message' => "Status anggota diperbarui ke '{$status}'"]);
        break;

    // DELETE /api/members?id=xxx — hapus anggota (admin)
    case 'DELETE':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) json_response(['error' => 'ID diperlukan'], 400);
        supabase_request('members?id=eq.' . $id, 'DELETE', [], true);
        json_response(['success' => true]);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
