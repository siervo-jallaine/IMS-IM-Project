<?php
include 'db_connection.php';
header('Content-Type: application/json');
session_start();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        getAddedSupplies();
        break;
    case 'POST':
        addSupply();
        break;
    case 'PUT':
        updateSupply();
        break;
    case 'DELETE':
        deleteSupply();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getAddedSupplies() {
    global $conn;

    try {
        $sql = "SELECT
                    pi.purchase_item_id,
                    i.ingredient_name as supply_name,
                    pi.quantity_received as quantity,
                    i.unit_measurement as unit,
                    u.username as received_by,
                    ip.purchase_date as date_added
                FROM purchase_item pi
                JOIN inventory_purchases ip ON pi.purchase_id = ip.purchase_id
                JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
                JOIN ingredient i ON si.ingredient_id = i.ingredient_id
                JOIN user u ON ip.user_id = u.user_id
                WHERE si.is_active = 1 AND i.is_active = 1
                ORDER BY ip.purchase_date DESC";

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

function addSupply() {
    global $conn;

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'error' => 'User not authenticated']);
            return;
        }

        $supply_name = $data['supply_name'];
        $quantity = $data['quantity'];
        $unit = $data['unit'];
        $user_id = $_SESSION['user_id'];

        $conn->begin_transaction();

        // Check if ingredient exists, if not create it
        $ingredient_sql = "SELECT ingredient_id FROM ingredient WHERE ingredient_name = ? AND is_active = 1";
        $ingredient_stmt = $conn->prepare($ingredient_sql);
        $ingredient_stmt->bind_param("s", $supply_name);
        $ingredient_stmt->execute();
        $ingredient_result = $ingredient_stmt->get_result();

        if ($ingredient_result->num_rows == 0) {
            // Create new ingredient
            $create_ingredient_sql = "INSERT INTO ingredient (ingredient_name, unit_measurement) VALUES (?, ?)";
            $create_ingredient_stmt = $conn->prepare($create_ingredient_sql);
            $create_ingredient_stmt->bind_param("ss", $supply_name, $unit);
            $create_ingredient_stmt->execute();
            $ingredient_id = $conn->insert_id;

            // Create supply inventory entry
            $create_supply_sql = "INSERT INTO supply_inventory (ingredient_id, current_quantity, supply_status) VALUES (?, ?, 'Available')";
            $create_supply_stmt = $conn->prepare($create_supply_sql);
            $create_supply_stmt->bind_param("id", $ingredient_id, $quantity);
            $create_supply_stmt->execute();
            $supply_inventory_id = $conn->insert_id;
        } else {
            $ingredient_row = $ingredient_result->fetch_assoc();
            $ingredient_id = $ingredient_row['ingredient_id'];

            // Get or create supply inventory
            $supply_sql = "SELECT supply_inventory_id, current_quantity FROM supply_inventory WHERE ingredient_id = ? AND is_active = 1";
            $supply_stmt = $conn->prepare($supply_sql);
            $supply_stmt->bind_param("i", $ingredient_id);
            $supply_stmt->execute();
            $supply_result = $supply_stmt->get_result();

            if ($supply_result->num_rows == 0) {
                // Create supply inventory entry
                $create_supply_sql = "INSERT INTO supply_inventory (ingredient_id, current_quantity, supply_status) VALUES (?, ?, 'Available')";
                $create_supply_stmt = $conn->prepare($create_supply_sql);
                $create_supply_stmt->bind_param("id", $ingredient_id, $quantity);
                $create_supply_stmt->execute();
                $supply_inventory_id = $conn->insert_id;
            } else {
                $supply_row = $supply_result->fetch_assoc();
                $supply_inventory_id = $supply_row['supply_inventory_id'];
                $current_quantity = $supply_row['current_quantity'];
                $new_quantity = $current_quantity + $quantity;

                // Update supply inventory quantity
                $update_supply_sql = "UPDATE supply_inventory SET current_quantity = ? WHERE supply_inventory_id = ?";
                $update_supply_stmt = $conn->prepare($update_supply_sql);
                $update_supply_stmt->bind_param("di", $new_quantity, $supply_inventory_id);
                $update_supply_stmt->execute();
            }
        }

        // Create inventory purchase record
        $purchase_sql = "INSERT INTO inventory_purchases (supplier_id, user_id, purchase_date, total_cost) VALUES (1, ?, CURDATE(), ?)";
        $total_cost = $quantity * 1.0; // Default unit cost
        $purchase_stmt = $conn->prepare($purchase_sql);
        $purchase_stmt->bind_param("id", $user_id, $total_cost);
        $purchase_stmt->execute();
        $purchase_id = $conn->insert_id;

        // Create purchase item record
        $purchase_item_sql = "INSERT INTO purchase_item (purchase_id, supply_inventory_id, quantity_received, unit_cost) VALUES (?, ?, ?, 1.0)";
        $purchase_item_stmt = $conn->prepare($purchase_item_sql);
        $purchase_item_stmt->bind_param("iid", $purchase_id, $supply_inventory_id, $quantity);
        $purchase_item_stmt->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Supply added successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function updateSupply() {
    global $conn;

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $purchase_item_id = $data['purchase_item_id'];
        $quantity = $data['quantity'];

        // Get current purchase item details
        $get_item_sql = "SELECT pi.supply_inventory_id, pi.quantity_received, si.current_quantity
                         FROM purchase_item pi
                         JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
                         WHERE pi.purchase_item_id = ?";
        $get_item_stmt = $conn->prepare($get_item_sql);
        $get_item_stmt->bind_param("i", $purchase_item_id);
        $get_item_stmt->execute();
        $item_result = $get_item_stmt->get_result();

        if ($item_result->num_rows == 0) {
            echo json_encode(['success' => false, 'error' => 'Purchase item not found']);
            return;
        }

        $item_row = $item_result->fetch_assoc();
        $supply_inventory_id = $item_row['supply_inventory_id'];
        $old_quantity = $item_row['quantity_received'];
        $current_inventory = $item_row['current_quantity'];

        $conn->begin_transaction();

        // Update purchase item
        $update_item_sql = "UPDATE purchase_item SET quantity_received = ? WHERE purchase_item_id = ?";
        $update_item_stmt = $conn->prepare($update_item_sql);
        $update_item_stmt->bind_param("di", $quantity, $purchase_item_id);
        $update_item_stmt->execute();

        // Update supply inventory (adjust for the difference)
        $quantity_difference = $quantity - $old_quantity;
        $new_inventory = $current_inventory + $quantity_difference;

        $update_inventory_sql = "UPDATE supply_inventory SET current_quantity = ? WHERE supply_inventory_id = ?";
        $update_inventory_stmt = $conn->prepare($update_inventory_sql);
        $update_inventory_stmt->bind_param("di", $new_inventory, $supply_inventory_id);
        $update_inventory_stmt->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Supply updated successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function deleteSupply() {
    global $conn;

    try {
        $purchase_item_id = $_GET['id'];

        // Get purchase item details
        $get_item_sql = "SELECT pi.supply_inventory_id, pi.quantity_received, si.current_quantity
                         FROM purchase_item pi
                         JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
                         WHERE pi.purchase_item_id = ?";
        $get_item_stmt = $conn->prepare($get_item_sql);
        $get_item_stmt->bind_param("i", $purchase_item_id);
        $get_item_stmt->execute();
        $item_result = $get_item_stmt->get_result();

        if ($item_result->num_rows == 0) {
            echo json_encode(['success' => false, 'error' => 'Purchase item not found']);
            return;
        }

        $item_row = $item_result->fetch_assoc();
        $supply_inventory_id = $item_row['supply_inventory_id'];
        $quantity_to_remove = $item_row['quantity_received'];
        $current_inventory = $item_row['current_quantity'];

        $conn->begin_transaction();

        // Delete purchase item
        $delete_item_sql = "DELETE FROM purchase_item WHERE purchase_item_id = ?";
        $delete_item_stmt = $conn->prepare($delete_item_sql);
        $delete_item_stmt->bind_param("i", $purchase_item_id);
        $delete_item_stmt->execute();

        // Update supply inventory (subtract the removed quantity)
        $new_inventory = $current_inventory - $quantity_to_remove;
        if ($new_inventory < 0) $new_inventory = 0;

        $update_inventory_sql = "UPDATE supply_inventory SET current_quantity = ? WHERE supply_inventory_id = ?";
        $update_inventory_stmt = $conn->prepare($update_inventory_sql);
        $update_inventory_stmt->bind_param("di", $new_inventory, $supply_inventory_id);
        $update_inventory_stmt->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Supply deleted successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>