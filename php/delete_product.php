<?php
require 'db_connection.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);
$variant_id = $input['product_variant_id'] ?? null;

if (!$variant_id) {
    echo json_encode(['success' => false, 'message' => 'Missing product_variant_id']);
    exit;
}

// Optional: Check if exists
$stmt = $conn->prepare("SELECT * FROM product_variant WHERE product_variant_id = ?");
$stmt->bind_param("i", $variant_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Product not found']);
    exit;
}

// Soft delete (set is_active = 0)
$stmt = $conn->prepare("UPDATE product_variant SET is_active = 0 WHERE product_variant_id = ?");
$stmt->bind_param("i", $variant_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
