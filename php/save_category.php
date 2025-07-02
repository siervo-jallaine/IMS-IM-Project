<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

// Get POST data
$category_id = isset($_POST['category_id']) ? intval($_POST['category_id']) : null;
$category_name = isset($_POST['category_name']) ? trim($_POST['category_name']) : '';

// Validate input
if (empty($category_name)) {
    echo json_encode(['success' => false, 'message' => 'Category name is required.']);
    exit;
}

// Check if this is an update or insert
if ($category_id) {
    // Update existing category
    $stmt = $conn->prepare("UPDATE category SET category_name = ? WHERE category_id = ?");
    $stmt->bind_param("si", $category_name, $category_id);
} else {
    // Insert new category
    $stmt = $conn->prepare("INSERT INTO category (category_name, is_active) VALUES (?, 1)");
    $stmt->bind_param("s", $category_name);
}

// Execute and respond
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$conn->close();
?>