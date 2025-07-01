<?php
require_once 'db_connection.php';

$result = $conn->query("SELECT DISTINCT product_name FROM product ORDER BY product_name ASC");
$names = [];

while ($row = $result->fetch_assoc()) {
    $names[] = $row['product_name'];
}

echo json_encode($names);
?>