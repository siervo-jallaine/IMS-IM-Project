<?php
require 'db_connection.php';
header('Content-Type: application/json');

// Validate product_variant_id
if (!isset($_GET['product_variant_id']) || !is_numeric($_GET['product_variant_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing or invalid product_variant_id'
    ]);
    exit;
}

$variantId = intval($_GET['product_variant_id']);

// Fetch ingredients with product name, size, and unit
$sql = "
    SELECT 
        p.product_name,
        ps.size_label,
        i.ingredient_name AS name,
        i.unit_measurement,
        pi.quantity
    FROM product_ingredient pi
    JOIN ingredient i ON pi.ingredient_id = i.ingredient_id
    JOIN product_variant pv ON pi.product_variant_id = pv.product_variant_id
    JOIN product p ON pv.product_code = p.product_code
    JOIN product_size ps ON pv.product_size_id = ps.product_size_id
    WHERE pi.product_variant_id = ? AND pi.is_active = 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $variantId);
$stmt->execute();
$result = $stmt->get_result();

$ingredients = [];
$productName = '';
$sizeLabel = '';

while ($row = $result->fetch_assoc()) {
    $productName = $row['product_name'];
    $sizeLabel = $row['size_label'];

    // Format quantity: remove .00 or trailing zeros if unnecessary
    $formattedQuantity = (intval($row['quantity']) == $row['quantity'])
        ? intval($row['quantity'])
        : rtrim(rtrim(number_format($row['quantity'], 2, '.', ''), '0'), '.');

    $ingredients[] = [
        'name' => $row['name'],
        'quantity' => $formattedQuantity,
        'unit' => $row['unit_measurement']
    ];
}

// Respond with ingredients, product name, and size
echo json_encode([
    'success' => true,
    'product_name' => $productName,
    'size_label' => $sizeLabel,
    'data' => $ingredients
]);
?>