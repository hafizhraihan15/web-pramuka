<?php
// ============================================================
// STATS API — Ringkasan Statistik untuk Dashboard
// ============================================================
require_once __DIR__ . '/../config.php';

if ($method !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Ambil data statistik dari semua tabel
$gallery  = supabase_request('gallery?select=count', 'GET', [], true);
$programs = supabase_request('programs?select=count&is_active=eq.true', 'GET', [], true);
$messages = supabase_request('messages?select=count&is_read=eq.false', 'GET', [], true);
$members  = supabase_request('members?select=count', 'GET', [], true);
$pending  = supabase_request('members?select=count&status=eq.pending', 'GET', [], true);

// Supabase returns count in header; this approach gets data length
$galleryAll  = supabase_request('gallery?select=id');
$programsAll = supabase_request('programs?select=id&is_active=eq.true');
$messagesAll = supabase_request('messages?select=id&is_read=eq.false');
$membersAll  = supabase_request('members?select=id');
$pendingAll  = supabase_request('members?select=id&status=eq.pending');

json_response([
    'success' => true,
    'data'    => [
        'gallery'          => count($galleryAll['data'] ?? []),
        'active_programs'  => count($programsAll['data'] ?? []),
        'unread_messages'  => count($messagesAll['data'] ?? []),
        'total_members'    => count($membersAll['data'] ?? []),
        'pending_members'  => count($pendingAll['data'] ?? []),
    ],
]);
