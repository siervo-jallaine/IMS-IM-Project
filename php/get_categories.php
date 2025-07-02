<?php
require 'db_connection.php';

header('Content-Type: application/json');

$categories = [];

$sql = "SELECT category_id, category_name FROM category WHERE is_active = 1 ORDER BY category_name ASC";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
}

echo json_encode($categories);
?>
