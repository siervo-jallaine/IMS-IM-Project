<?php
// ==== NEW FILE: added_supply_api.php ====
include 'db_connection.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'load') {
                loadAddedSupplies();
            }
            break;
        case 'POST':
            if ($action === 'add') {
                addSupply();
            }
            break;
        case 'PUT':
            if ($action === 'update') {
                updateSupply();
            }
            break;
        case 'DELETE':
            if ($action === 'delete') {
                deleteSupply();
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function loadAddedSupplies() {
  global $conn;

  $sql = "SELECT
              pi.purchase_item_id,
              i.ingredient_name as supply_name,
              pi.quantity_received as quantity,
              i.unit_measurement as unit,
              u.username as received_by,
              ip.purchase_date as date_added,
              ip.purchase_id
          FROM purchase_item pi
          JOIN inventory_purchases ip ON pi.purchase_id = ip.purchase_id
          JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
          JOIN ingredient i ON si.ingredient_id = i.ingredient_id
          JOIN user u ON ip.user_id = u.user_id
          WHERE si.is_active = 1
          AND pi.is_active = 1
          AND pi.is_deleted = 0
          AND ip.is_active = 1
          AND ip.is_deleted = 0
          AND i.is_active = 1
          ORDER BY ip.purchase_date DESC, pi.purchase_item_id DESC";

  $result = $conn->query($sql);
  $supplies = [];

  if ($result && $result->num_rows > 0) {
      while ($row = $result->fetch_assoc()) {
          $supplies[] = $row;
      }
  }

  echo json_encode(['success' => true, 'data' => $supplies]);
}

function addSupply() {
  global $conn;

  $input = json_decode(file_get_contents('php://input'), true);

  $supplyName = trim($input['supplyName'] ?? '');
  $quantity = floatval($input['quantity'] ?? 0);
  $unit = trim($input['unit'] ?? '');
  $receivedBy = trim($input['receivedBy'] ?? '');

  if (empty($supplyName) || $quantity <= 0 || empty($unit) || empty($receivedBy)) {
      throw new Exception('All fields are required and quantity must be greater than 0');
  }

  $conn->begin_transaction();

  try {
      // Get user_id from username
      $getUserId = $conn->prepare("SELECT user_id FROM user WHERE username = ? AND is_active = 1");
      $getUserId->bind_param("s", $receivedBy);
      $getUserId->execute();
      $userResult = $getUserId->get_result();

      if ($userResult->num_rows === 0) {
          throw new Exception('User not found');
      }

      $userRow = $userResult->fetch_assoc();
      $userId = $userRow['user_id'];

      // Check if ingredient exists, if not create it
      $checkIngredient = $conn->prepare("SELECT ingredient_id FROM ingredient WHERE ingredient_name = ? AND is_active = 1");
      $checkIngredient->bind_param("s", $supplyName);
      $checkIngredient->execute();
      $ingredientResult = $checkIngredient->get_result();

      if ($ingredientResult->num_rows === 0) {
          // Create new ingredient
          $insertIngredient = $conn->prepare("INSERT INTO ingredient (ingredient_name, unit_measurement, is_active) VALUES (?, ?, 1)");
          $insertIngredient->bind_param("ss", $supplyName, $unit);
          $insertIngredient->execute();
          $ingredientId = $conn->insert_id;
      } else {
          $ingredientRow = $ingredientResult->fetch_assoc();
          $ingredientId = $ingredientRow['ingredient_id'];
      }

      // Check if supply_inventory exists for this ingredient
      $checkSupplyInventory = $conn->prepare("SELECT supply_inventory_id, current_quantity FROM supply_inventory WHERE ingredient_id = ? AND is_active = 1");
      $checkSupplyInventory->bind_param("i", $ingredientId);
      $checkSupplyInventory->execute();
      $supplyInventoryResult = $checkSupplyInventory->get_result();

      if ($supplyInventoryResult->num_rows === 0) {
          // Create supply inventory entry
          $insertSupplyInventory = $conn->prepare("INSERT INTO supply_inventory (ingredient_id, current_quantity, supply_status, is_active) VALUES (?, ?, 'Available', 1)");
          $insertSupplyInventory->bind_param("id", $ingredientId, $quantity);
          $insertSupplyInventory->execute();
          $supplyInventoryId = $conn->insert_id;
      } else {
          $supplyInventoryRow = $supplyInventoryResult->fetch_assoc();
          $supplyInventoryId = $supplyInventoryRow['supply_inventory_id'];
          $currentQuantity = $supplyInventoryRow['current_quantity'];

          // Update current quantity
          $newQuantity = $currentQuantity + $quantity;
          $updateSupplyInventory = $conn->prepare("UPDATE supply_inventory SET current_quantity = ? WHERE supply_inventory_id = ?");
          $updateSupplyInventory->bind_param("di", $newQuantity, $supplyInventoryId);
          $updateSupplyInventory->execute();
      }

      // Get or create a default supplier for internal purchases
      $defaultSupplierName = 'Internal Purchase';
      $checkSupplier = $conn->prepare("SELECT supplier_id FROM supplier WHERE supplier_name = ? AND is_active = 1");
      $checkSupplier->bind_param("s", $defaultSupplierName);
      $checkSupplier->execute();
      $supplierResult = $checkSupplier->get_result();

      if ($supplierResult->num_rows === 0) {
          $insertSupplier = $conn->prepare("INSERT INTO supplier (supplier_name, is_active) VALUES (?, 1)");
          $insertSupplier->bind_param("s", $defaultSupplierName);
          $insertSupplier->execute();
          $supplierId = $conn->insert_id;
      } else {
          $supplierRow = $supplierResult->fetch_assoc();
          $supplierId = $supplierRow['supplier_id'];
      }

      // Create inventory purchase record
      $insertPurchase = $conn->prepare("INSERT INTO inventory_purchases (supplier_id, user_id, purchase_date, total_cost, is_deleted, is_active) VALUES (?, ?, CURDATE(), 0.00, 0, 1)");
      $insertPurchase->bind_param("ii", $supplierId, $userId);
      $insertPurchase->execute();
      $purchaseId = $conn->insert_id;

      // Create purchase item record
      $insertPurchaseItem = $conn->prepare("INSERT INTO purchase_item (purchase_id, supply_inventory_id, quantity_received, unit_cost, is_deleted, is_active) VALUES (?, ?, ?, 0.0000, 0, 1)");
      $insertPurchaseItem->bind_param("iid", $purchaseId, $supplyInventoryId, $quantity);
      $insertPurchaseItem->execute();

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Supply added successfully']);

  } catch (Exception $e) {
      $conn->rollback();
      throw $e;
  }
}

function updateSupply() {
  global $conn;

  $input = json_decode(file_get_contents('php://input'), true);

  $purchaseItemId = intval($input['purchase_item_id'] ?? 0);
  $supplyName = trim($input['supplyName'] ?? '');
  $quantity = floatval($input['quantity'] ?? 0);
  $unit = trim($input['unit'] ?? '');
  $receivedBy = trim($input['receivedBy'] ?? '');

  if ($purchaseItemId <= 0 || empty($supplyName) || $quantity <= 0 || empty($unit) || empty($receivedBy)) {
      throw new Exception('All fields are required and quantity must be greater than 0');
  }

  $conn->begin_transaction();

  try {
      // Get user_id from username
      $getUserId = $conn->prepare("SELECT user_id FROM user WHERE username = ? AND is_active = 1");
      $getUserId->bind_param("s", $receivedBy);
      $getUserId->execute();
      $userResult = $getUserId->get_result();

      if ($userResult->num_rows === 0) {
          throw new Exception('User not found');
      }

      $userRow = $userResult->fetch_assoc();
      $userId = $userRow['user_id'];

      // Get current purchase item details
      $getCurrentDetails = $conn->prepare("
          SELECT pi.quantity_received, pi.supply_inventory_id, pi.purchase_id,
                 i.ingredient_id, i.ingredient_name, i.unit_measurement
          FROM purchase_item pi
          JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
          JOIN ingredient i ON si.ingredient_id = i.ingredient_id
          WHERE pi.purchase_item_id = ?
          AND pi.is_active = 1
          AND pi.is_deleted = 0
          AND si.is_active = 1
          AND i.is_active = 1
      ");
      $getCurrentDetails->bind_param("i", $purchaseItemId);
      $getCurrentDetails->execute();
      $currentResult = $getCurrentDetails->get_result();

      if ($currentResult->num_rows === 0) {
          throw new Exception('Purchase item not found');
      }

      $currentRow = $currentResult->fetch_assoc();
      $currentQuantity = $currentRow['quantity_received'];
      $supplyInventoryId = $currentRow['supply_inventory_id'];
      $purchaseId = $currentRow['purchase_id'];
      $ingredientId = $currentRow['ingredient_id'];

      // Update ingredient name and unit
      $updateIngredient = $conn->prepare("UPDATE ingredient SET ingredient_name = ?, unit_measurement = ? WHERE ingredient_id = ?");
      $updateIngredient->bind_param("ssi", $supplyName, $unit, $ingredientId);
      $updateIngredient->execute();

      // Update purchase item
      $updatePurchaseItem = $conn->prepare("UPDATE purchase_item SET quantity_received = ? WHERE purchase_item_id = ?");
      $updatePurchaseItem->bind_param("di", $quantity, $purchaseItemId);
      $updatePurchaseItem->execute();

      // Update inventory purchase user
      $updatePurchase = $conn->prepare("UPDATE inventory_purchases SET user_id = ? WHERE purchase_id = ?");
      $updatePurchase->bind_param("ii", $userId, $purchaseId);
      $updatePurchase->execute();

      // Update supply inventory quantity
      $getInventoryQuantity = $conn->prepare("SELECT current_quantity FROM supply_inventory WHERE supply_inventory_id = ?");
      $getInventoryQuantity->bind_param("i", $supplyInventoryId);
      $getInventoryQuantity->execute();
      $inventoryResult = $getInventoryQuantity->get_result();
      $inventoryRow = $inventoryResult->fetch_assoc();
      $inventoryQuantity = $inventoryRow['current_quantity'];

      // Calculate new inventory quantity (remove old quantity, add new quantity)
      $newInventoryQuantity = $inventoryQuantity - $currentQuantity + $quantity;

      $updateInventory = $conn->prepare("UPDATE supply_inventory SET current_quantity = ? WHERE supply_inventory_id = ?");
      $updateInventory->bind_param("di", $newInventoryQuantity, $supplyInventoryId);
      $updateInventory->execute();

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Supply updated successfully']);

  } catch (Exception $e) {
      $conn->rollback();
      throw $e;
  }
}

function deleteSupply() {
  global $conn;

  $input = json_decode(file_get_contents('php://input'), true);
  $purchaseItemId = intval($input['purchase_item_id'] ?? 0);

  if ($purchaseItemId <= 0) {
      throw new Exception('Invalid purchase item ID');
  }

  $conn->begin_transaction();

  try {
      // Get purchase item details before deletion
      $getDetails = $conn->prepare("
          SELECT pi.quantity_received, pi.supply_inventory_id, pi.purchase_id,
                 si.ingredient_id, ip.supplier_id
          FROM purchase_item pi
          JOIN supply_inventory si ON pi.supply_inventory_id = si.supply_inventory_id
          JOIN inventory_purchases ip ON pi.purchase_id = ip.purchase_id
          WHERE pi.purchase_item_id = ?
          AND pi.is_active = 1
          AND pi.is_deleted = 0
          AND si.is_active = 1
          AND ip.is_active = 1
      ");
      $getDetails->bind_param("i", $purchaseItemId);
      $getDetails->execute();
      $result = $getDetails->get_result();

      if ($result->num_rows === 0) {
          throw new Exception('Purchase item not found');
      }

      $row = $result->fetch_assoc();
      $quantity = $row['quantity_received'];
      $supplyInventoryId = $row['supply_inventory_id'];
      $purchaseId = $row['purchase_id'];
      $ingredientId = $row['ingredient_id'];
      $supplierId = $row['supplier_id'];

      // Update supply inventory (subtract the deleted quantity) and set is_active = 0
      $updateInventory = $conn->prepare("
          UPDATE supply_inventory
          SET current_quantity = current_quantity - ?,
              is_active = 0
          WHERE supply_inventory_id = ?
      ");
      $updateInventory->bind_param("di", $quantity, $supplyInventoryId);
      $updateInventory->execute();

      // Set purchase_item is_deleted = 1 and is_active = 0
      $updatePurchaseItem = $conn->prepare("
          UPDATE purchase_item
          SET is_deleted = 1,
              is_active = 0
          WHERE purchase_item_id = ?
      ");
      $updatePurchaseItem->bind_param("i", $purchaseItemId);
      $updatePurchaseItem->execute();

      // Set inventory_purchases is_deleted = 1 and is_active = 0
      $updateInventoryPurchases = $conn->prepare("
          UPDATE inventory_purchases
          SET is_deleted = 1,
              is_active = 0
          WHERE purchase_id = ?
      ");
      $updateInventoryPurchases->bind_param("i", $purchaseId);
      $updateInventoryPurchases->execute();

      // Set ingredient is_active = 0
      $updateIngredient = $conn->prepare("
          UPDATE ingredient
          SET is_active = 0
          WHERE ingredient_id = ?
      ");
      $updateIngredient->bind_param("i", $ingredientId);
      $updateIngredient->execute();

      // Set supplier is_active = 0
      $updateSupplier = $conn->prepare("
          UPDATE supplier
          SET is_active = 0
          WHERE supplier_id = ?
      ");
      $updateSupplier->bind_param("i", $supplierId);
      $updateSupplier->execute();

      // Set supply_supplier is_active = 0 (if exists)
      $updateSupplySupplier = $conn->prepare("
          UPDATE supply_supplier
          SET is_active = 0
          WHERE supply_inventory_id = ? AND supplier_id = ?
      ");
      $updateSupplySupplier->bind_param("ii", $supplyInventoryId, $supplierId);
      $updateSupplySupplier->execute();

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Supply deleted successfully']);

  } catch (Exception $e) {
      $conn->rollback();
      throw $e;
  }
}
?>