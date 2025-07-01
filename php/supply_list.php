<?php
include 'db_connection.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        getSupplyList();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getSupplyList() {
    global $conn;

    try {
        $sql = "SELECT
                    si.supply_inventory_id,
                    i.ingredient_name as supply_name,
                    si.current_quantity as quantity,
                    i.unit_measurement as unit,
                    si.supply_status
                FROM supply_inventory si
                JOIN ingredient i ON si.ingredient_id = i.ingredient_id
                WHERE si.is_active = 1 AND i.is_active = 1
                ORDER BY i.ingredient_name";

        $result = $conn->query($sql);
        $supplies = [];

        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $supplies[] = $row;
            }
        }

        echo json_encode(['success' => true, 'data' => $supplies]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>