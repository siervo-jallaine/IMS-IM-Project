<?php
// delete_sale.php
header('Content-Type: application/json');
require_once 'db_connection.php';

// Read raw JSON body
$input = json_decode(file_get_contents('php://input'), true);

$usage_id = $input['usage_id'] ?? null;

if (!$usage_id) {
    echo json_encode(['success' => false, 'message' => 'Missing usage_id']);
    exit;
}

// Soft delete (set is_deleted = 1)
$stmt = $conn->prepare("UPDATE inventory_usage_log SET is_deleted = 1 WHERE usage_id = ?");
$stmt->bind_param("i", $usage_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$conn->close();
?>
