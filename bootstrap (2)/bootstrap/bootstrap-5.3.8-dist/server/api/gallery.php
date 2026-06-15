<?php
// ============================================================
// GALLERY API — CRUD + Cloudinary Upload
// ============================================================
require_once __DIR__ . '/../config.php';

switch ($method) {

    // GET /api/gallery — ambil semua foto (publik)
    case 'GET':
        $category = $_GET['category'] ?? '';
        $endpoint = 'gallery?order=created_at.desc&select=*';
        if ($category && $category !== 'all') {
            $endpoint .= '&category=eq.' . urlencode($category);
        }
        $result = supabase_request($endpoint);
        json_response(['success' => true, 'data' => $result['data']]);
        break;

    // POST /api/gallery — upload foto baru (admin only)
    case 'POST':
        $user = require_auth();

        // Terima multipart/form-data
        $title       = $_POST['title'] ?? 'Foto Kegiatan';
        $category    = $_POST['category'] ?? 'Umum';
        $description = $_POST['description'] ?? '';

        if (empty($_FILES['photo'])) {
            json_response(['error' => 'File foto wajib diunggah'], 400);
        }

        $file      = $_FILES['photo'];
        $tmpPath   = $file['tmp_name'];
        $mimeType  = $file['type'];
        $allowed   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!in_array($mimeType, $allowed)) {
            json_response(['error' => 'Format file tidak valid. Gunakan JPG, PNG, atau WEBP'], 400);
        }

        if ($file['size'] > 10 * 1024 * 1024) {
            json_response(['error' => 'Ukuran file maksimal 10MB'], 400);
        }

        // Upload ke Cloudinary
        $cloudinaryUrl = 'https://api.cloudinary.com/v1_1/' . CLOUDINARY_CLOUD_NAME . '/image/upload';
        $timestamp     = time();
        $folder        = 'pramuka_inhil/' . strtolower($category);
        $paramsToSign  = "folder={$folder}&timestamp={$timestamp}" . CLOUDINARY_API_SECRET;
        $signature     = sha1($paramsToSign);

        $ch = curl_init($cloudinaryUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => [
                'file'       => new CURLFile($tmpPath, $mimeType, $file['name']),
                'api_key'    => CLOUDINARY_API_KEY,
                'timestamp'  => $timestamp,
                'signature'  => $signature,
                'folder'     => $folder,
            ],
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $cloudResp  = json_decode(curl_exec($ch), true);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpStatus !== 200 || empty($cloudResp['secure_url'])) {
            json_response(['error' => 'Upload ke Cloudinary gagal', 'detail' => $cloudResp], 500);
        }

        // Simpan ke Supabase
        $insert = supabase_request('gallery', 'POST', [
            'title'       => $title,
            'category'    => $category,
            'description' => $description,
            'image_url'   => $cloudResp['secure_url'],
            'public_id'   => $cloudResp['public_id'],
            'width'       => $cloudResp['width'],
            'height'      => $cloudResp['height'],
            'uploaded_by' => $user['email'],
        ]);

        json_response(['success' => true, 'data' => $insert['data']]);
        break;

    // DELETE /api/gallery?id=xxx — hapus foto (admin only)
    case 'DELETE':
        $user = require_auth();
        $id   = $_GET['id'] ?? '';
        if (!$id) {
            json_response(['error' => 'ID foto wajib diisi'], 400);
        }

        // Ambil public_id dulu untuk hapus dari Cloudinary
        $photo = supabase_request('gallery?id=eq.' . $id . '&select=public_id');
        if (!empty($photo['data'][0]['public_id'])) {
            $publicId  = $photo['data'][0]['public_id'];
            $timestamp = time();
            $sig       = sha1("public_id={$publicId}&timestamp={$timestamp}" . CLOUDINARY_API_SECRET);
            $ch = curl_init('https://api.cloudinary.com/v1_1/' . CLOUDINARY_CLOUD_NAME . '/image/destroy');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => [
                    'public_id' => $publicId,
                    'api_key'   => CLOUDINARY_API_KEY,
                    'timestamp' => $timestamp,
                    'signature' => $sig,
                ],
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            curl_exec($ch);
            curl_close($ch);
        }

        supabase_request('gallery?id=eq.' . $id, 'DELETE', [], true);
        json_response(['success' => true, 'message' => 'Foto berhasil dihapus']);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
