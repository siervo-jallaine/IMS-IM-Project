<?php
require 'db_connection.php';
header('Content-Type: application/json');

$product_name = $_POST['product_name'] ?? '';
$size_label = $_POST['product_size'] ?? '';
$category_id = $_POST['category_id'] ?? '';
$ingredient_names = $_POST['ingredient_name'] ?? [];
$ingredient_units = $_POST['ingredient_unit'] ?? [];
$ingredient_quantities = $_POST['ingredient_quantity'] ?? [];

if (!$product_name || !$size_label || !$category_id) {
    echo json_encode(['success' => false, 'message' => 'Missing product details']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Check if product already exists
    $stmt = $conn->prepare("SELECT product_code FROM product WHERE product_name = ? AND category_id = ?");
    $stmt->bind_param("si", $product_name, $category_id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        $product_code = $row['product_code'];
    } else {
        // 2. Insert new product
        $stmt = $conn->prepare("INSERT INTO product (product_name, category_id) VALUES (?, ?)");
        $stmt->bind_param("si", $product_name, $category_id);
        $stmt->execute();
        $product_code = $stmt->insert_id; // AUTO_INCREMENT product_code
    }

    // 3. Insert/Get size
    $stmt = $conn->prepare("SELECT product_size_id FROM product_size WHERE size_label = ?");
    $stmt->bind_param("s", $size_label);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        $size_id = $row['product_size_id'];
    } else {
        $stmt = $conn->prepare("INSERT INTO product_size (size_label) VALUES (?)");
        $stmt->bind_param("s", $size_label);
        $stmt->execute();
        $size_id = $stmt->insert_id;
    }

    // 4. Insert product_variant
    $stmt = $conn->prepare("INSERT INTO product_variant (product_code, product_size_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $product_code, $size_id);
    $stmt->execute();
    $variant_id = $stmt->insert_id;

    // 5. Loop through ingredients
    for ($i = 0; $i < count($ingredient_names); $i++) {
        $name = trim($ingredient_names[$i]);
        $unit = trim($ingredient_units[$i]);
        $quantity = floatval($ingredient_quantities[$i]);

        if (!$name || !$unit || $quantity <= 0) continue;

        // Insert/get ingredient
        $stmt = $conn->prepare("SELECT ingredient_id FROM ingredient WHERE ingredient_name = ? AND unit_measurement = ?");
        $stmt->bind_param("ss", $name, $unit);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows > 0) {
            $row = $res->fetch_assoc();
            $ingredient_id = $row['ingredient_id'];
        } else {
            $stmt = $conn->prepare("INSERT INTO ingredient (ingredient_name, unit_measurement) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $unit);
            $stmt->execute();
            $ingredient_id = $stmt->insert_id;
        }

        // Insert into product_ingredient
        $stmt = $conn->prepare("INSERT INTO product_ingredient (product_variant_id, ingredient_id, quantity) VALUES (?, ?, ?)");
        $stmt->bind_param("iid", $variant_id, $ingredient_id, $quantity);
        $stmt->execute();
    }

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>