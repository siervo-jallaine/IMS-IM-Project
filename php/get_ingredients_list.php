<?php
require 'db_connection.php';
header('Content-Type: application/json');

$sql = "SELECT ingredient_id AS id, ingredient_name AS name, unit_measurement AS unit FROM ingredient WHERE is_active = 1 ORDER BY ingredient_name ASC";
$result = $conn->query($sql);

$ingredients = [];
while ($row = $result->fetch_assoc()) {
    $ingredients[] = $row;
}

echo json_encode($ingredients);
