<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$sql = "
SELECT 
        usage_log.usage_id,
        p.product_name,
        ps.size_label,
        usage_log.quantity_sold,
        u.username AS entered_by,
        usage_log.usage_date
    FROM inventory_usage_log AS usage_log
    LEFT JOIN product_variant AS pv ON usage_log.product_variant_id = pv.product_variant_id
    LEFT JOIN product AS p ON pv.product_code = p.product_code
    LEFT JOIN product_size AS ps ON pv.product_size_id = ps.product_size_id
    LEFT JOIN user AS u ON usage_log.user_id = u.user_id
    WHERE usage_log.is_deleted = 0
    ORDER BY usage_log.usage_date DESC
";

$result = $conn->query($sql);

$sales = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $sales[] = $row;
    }
}

echo json_encode($sales);
$conn->close();
?>
