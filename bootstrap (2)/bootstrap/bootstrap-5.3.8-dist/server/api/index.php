<?php
// ============================================================
// API ROUTER — server/api/index.php
// Letakkan di: C:\xampp\htdocs\pramuka\server\api\index.php
// ============================================================
require_once __DIR__ . '/../config.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip base path (sesuaikan jika perlu)
$uri = preg_replace('#^/pramuka/server/api#', '', $uri);
$uri = trim($uri, '/');
$parts = explode('/', $uri);
$resource = $parts[0] ?? '';

switch ($resource) {
    case 'auth':
        require __DIR__ . '/auth.php';
        break;
    case 'gallery':
        require __DIR__ . '/gallery.php';
        break;
    case 'programs':
        require __DIR__ . '/programs.php';
        break;
    case 'messages':
        require __DIR__ . '/messages.php';
        break;
    case 'members':
        require __DIR__ . '/members.php';
        break;
    case 'stats':
        require __DIR__ . '/stats.php';
        break;
    default:
        json_response(['message' => 'Pramuka MAN 1 INHIL API v1.0', 'status' => 'running'], 200);
}
