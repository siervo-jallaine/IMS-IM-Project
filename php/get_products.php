<?php
require 'db_connection.php';
header('Content-Type: application/json');

// Check if category_id is present in the GET request
if (!isset($_GET['category_id']) || !is_numeric($_GET['category_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing or invalid category_id'
    ]);
    exit;
}

$categoryId = intval($_GET['category_id']);

// Prepare SQL query
$sql = "
    SELECT 
        pv.product_variant_id,
        p.product_code, 
        p.product_name, 
        ps.size_label, 
        c.category_name
    FROM product p
    LEFT JOIN product_variant pv ON p.product_code = pv.product_code
    LEFT JOIN product_size ps ON pv.product_size_id = ps.product_size_id
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE p.category_id = ?
    ORDER BY p.product_name ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $categoryId);
$stmt->execute();
$result = $stmt->get_result();

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

// Send response
echo json_encode([
    'success' => true,
    'data' => $products
]);
?>
