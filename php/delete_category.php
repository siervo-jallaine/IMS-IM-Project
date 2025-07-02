<?php
// delete_category.php
header('Content-Type: application/json');
require_once 'db_connection.php';

// Read raw JSON body
$input = json_decode(file_get_contents('php://input'), true);

$category_id = $input['category_id'] ?? null;

if (!$category_id) {
    echo json_encode(['success' => false, 'message' => 'Missing category_id']);
    exit;
}

// Soft delete (set is_active = 0)
$stmt = $conn->prepare("UPDATE category SET is_active = 0 WHERE category_id = ?");
$stmt->bind_param("i", $category_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$conn->close();
?>
