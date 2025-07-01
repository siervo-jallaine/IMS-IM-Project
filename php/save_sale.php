<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$usage_id     = $_POST['usage_id'];
$product_name = $_POST['product_name'];
$size_label   = $_POST['size_label'];
$quantity     = intval($_POST['quantity_sold']);
$entered_by   = $_POST['entered_by'];

// 1. Get user_id
$user_q = $conn->prepare("SELECT user_id FROM user WHERE username = ?");
$user_q->bind_param("s", $entered_by);
$user_q->execute();
$user_result = $user_q->get_result();
$user_row = $user_result->fetch_assoc();
$user_id = $user_row ? $user_row['user_id'] : null;

// 2. Get product_variant_id
$variant_q = $conn->prepare("
    SELECT pv.product_variant_id 
    FROM product_variant pv
    JOIN product p ON pv.product_code = p.product_code
    JOIN product_size ps ON pv.product_size_id = ps.product_size_id
    WHERE p.product_name = ? AND ps.size_label = ?
");
$variant_q->bind_param("ss", $product_name, $size_label);
$variant_q->execute();
$variant_result = $variant_q->get_result();
$variant_row = $variant_result->fetch_assoc();
$product_variant_id = $variant_row ? $variant_row['product_variant_id'] : null;

if (!$user_id || !$product_variant_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user or product/size.']);
    exit;
}

// 3. Insert or update
if ($usage_id) {
    // Update
    $stmt = $conn->prepare("UPDATE inventory_usage_log SET product_variant_id = ?, quantity_sold = ?, user_id = ? WHERE usage_id = ?");
    $stmt->bind_param("iiis", $product_variant_id, $quantity, $user_id, $usage_id);
} else {
    // Insert
    $stmt = $conn->prepare("INSERT INTO inventory_usage_log (product_variant_id, quantity_sold, user_id) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $product_variant_id, $quantity, $user_id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$conn->close();
?>
