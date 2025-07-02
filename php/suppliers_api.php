<?php
// ==== NEW FILE: suppliers_api.php ====
include 'db_connection.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'load') {
                loadSuppliers();
            }
            break;
        case 'POST':
            if ($action === 'add') {
                addSupplier();
            }
            break;
        case 'PUT':
            if ($action === 'update') {
                updateSupplier();
            }
            break;
        case 'DELETE':
            if ($action === 'delete') {
                deleteSupplier();
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function loadSuppliers() {
    global $conn;

    $sql = "SELECT
                ss.supply_supplier_id,
                s.supplier_name,
                s.contact_no,
                i.ingredient_name as supply_name,
                ss.is_primary,
                s.supplier_id,
                si.supply_inventory_id
            FROM supply_supplier ss
            JOIN supplier s ON ss.supplier_id = s.supplier_id
            JOIN supply_inventory si ON ss.supply_inventory_id = si.supply_inventory_id
            JOIN ingredient i ON si.ingredient_id = i.ingredient_id
            WHERE ss.is_active = 1 AND s.is_active = 1 AND si.is_active = 1
            ORDER BY s.supplier_name";

    $result = $conn->query($sql);
    $suppliers = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $suppliers[] = $row;
        }
    }

    echo json_encode(['success' => true, 'data' => $suppliers]);
}

function addSupplier() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $supplyName = trim($input['supplyName'] ?? '');
    $supplierName = trim($input['supplierName'] ?? '');
    $contactNumber = trim($input['contactNumber'] ?? '');

    if (empty($supplyName) || empty($supplierName)) {
        throw new Exception('Supply name and supplier name are required');
    }

    $conn->begin_transaction();

    try {
        // First, check if the ingredient (supply) exists, if not create it
        $checkIngredient = $conn->prepare("SELECT ingredient_id FROM ingredient WHERE ingredient_name = ? AND is_active = 1");
        $checkIngredient->bind_param("s", $supplyName);
        $checkIngredient->execute();
        $ingredientResult = $checkIngredient->get_result();

        if ($ingredientResult->num_rows === 0) {
            // Create new ingredient
            $insertIngredient = $conn->prepare("INSERT INTO ingredient (ingredient_name, unit_measurement, is_active) VALUES (?, 'kg', 1)");
            $insertIngredient->bind_param("s", $supplyName);
            $insertIngredient->execute();
            $ingredientId = $conn->insert_id;
        } else {
            $ingredientRow = $ingredientResult->fetch_assoc();
            $ingredientId = $ingredientRow['ingredient_id'];
        }

        // Check if supply_inventory exists for this ingredient
        $checkSupplyInventory = $conn->prepare("SELECT supply_inventory_id FROM supply_inventory WHERE ingredient_id = ? AND is_active = 1");
        $checkSupplyInventory->bind_param("i", $ingredientId);
        $checkSupplyInventory->execute();
        $supplyInventoryResult = $checkSupplyInventory->get_result();

        if ($supplyInventoryResult->num_rows === 0) {
            // Create supply inventory entry
            $insertSupplyInventory = $conn->prepare("INSERT INTO supply_inventory (ingredient_id, current_quantity, supply_status, is_active) VALUES (?, 0.00, 'Available', 1)");
            $insertSupplyInventory->bind_param("i", $ingredientId);
            $insertSupplyInventory->execute();
            $supplyInventoryId = $conn->insert_id;
        } else {
            $supplyInventoryRow = $supplyInventoryResult->fetch_assoc();
            $supplyInventoryId = $supplyInventoryRow['supply_inventory_id'];
        }

        // Check if supplier exists, if not create it
        $checkSupplier = $conn->prepare("SELECT supplier_id FROM supplier WHERE supplier_name = ? AND is_active = 1");
        $checkSupplier->bind_param("s", $supplierName);
        $checkSupplier->execute();
        $supplierResult = $checkSupplier->get_result();

        if ($supplierResult->num_rows === 0) {
            // Create new supplier
            $insertSupplier = $conn->prepare("INSERT INTO supplier (supplier_name, contact_no, is_active) VALUES (?, ?, 1)");
            $insertSupplier->bind_param("ss", $supplierName, $contactNumber);
            $insertSupplier->execute();
            $supplierId = $conn->insert_id;
        } else {
            $supplierRow = $supplierResult->fetch_assoc();
            $supplierId = $supplierRow['supplier_id'];

            // Update contact number if provided
            if (!empty($contactNumber)) {
                $updateSupplier = $conn->prepare("UPDATE supplier SET contact_no = ? WHERE supplier_id = ?");
                $updateSupplier->bind_param("si", $contactNumber, $supplierId);
                $updateSupplier->execute();
            }
        }

        // Check if this supplier-supply relationship already exists
        $checkRelation = $conn->prepare("SELECT supply_supplier_id FROM supply_supplier WHERE supplier_id = ? AND supply_inventory_id = ? AND is_active = 1");
        $checkRelation->bind_param("ii", $supplierId, $supplyInventoryId);
        $checkRelation->execute();
        $relationResult = $checkRelation->get_result();

        if ($relationResult->num_rows > 0) {
            throw new Exception('This supplier is already linked to this supply item');
        }

        // Create supply_supplier relationship
        $insertSupplySupplier = $conn->prepare("INSERT INTO supply_supplier (supplier_id, supply_inventory_id, is_primary, is_active) VALUES (?, ?, 0, 1)");
        $insertSupplySupplier->bind_param("ii", $supplierId, $supplyInventoryId);
        $insertSupplySupplier->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Supplier added successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

function updateSupplier() {
  global $conn;

  $input = json_decode(file_get_contents('php://input'), true);

  $supplySupplierID = intval($input['supply_supplier_id'] ?? 0);
  $supplierName = trim($input['supplierName'] ?? '');
  $contactNumber = trim($input['contactNumber'] ?? '');
  $supplyName = trim($input['supplyName'] ?? '');

  if ($supplySupplierID <= 0 || empty($supplierName) || empty($supplyName)) {
      throw new Exception('Invalid supplier data');
  }

  $conn->begin_transaction();

  try {
      // Get supplier_id and supply_inventory_id from supply_supplier table
      $getIDs = $conn->prepare("SELECT ss.supplier_id, ss.supply_inventory_id, si.ingredient_id
                                FROM supply_supplier ss
                                JOIN supply_inventory si ON ss.supply_inventory_id = si.supply_inventory_id
                                WHERE ss.supply_supplier_id = ?");
      $getIDs->bind_param("i", $supplySupplierID);
      $getIDs->execute();
      $result = $getIDs->get_result();

      if ($result->num_rows === 0) {
          throw new Exception('Supplier relationship not found');
      }

      $row = $result->fetch_assoc();
      $supplierId = $row['supplier_id'];
      $ingredientId = $row['ingredient_id'];

      // Update supplier information
      $updateSupplier = $conn->prepare("UPDATE supplier SET supplier_name = ?, contact_no = ? WHERE supplier_id = ?");
      $updateSupplier->bind_param("ssi", $supplierName, $contactNumber, $supplierId);
      $updateSupplier->execute();

      // Update ingredient (supply) name
      $updateIngredient = $conn->prepare("UPDATE ingredient SET ingredient_name = ? WHERE ingredient_id = ?");
      $updateIngredient->bind_param("si", $supplyName, $ingredientId);
      $updateIngredient->execute();

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Supplier updated successfully']);

  } catch (Exception $e) {
      $conn->rollback();
      throw $e;
  }
}

function deleteSupplier() {
  global $conn;

  $input = json_decode(file_get_contents('php://input'), true);
  $supplySupplierID = intval($input['supply_supplier_id'] ?? 0);

  if ($supplySupplierID <= 0) {
      throw new Exception('Invalid supplier ID');
  }

  $conn->begin_transaction();

  try {
      // Get supplier_id, supply_inventory_id, and ingredient_id
      $getIDs = $conn->prepare("SELECT ss.supplier_id, ss.supply_inventory_id, si.ingredient_id
                                FROM supply_supplier ss
                                JOIN supply_inventory si ON ss.supply_inventory_id = si.supply_inventory_id
                                WHERE ss.supply_supplier_id = ?");
      $getIDs->bind_param("i", $supplySupplierID);
      $getIDs->execute();
      $result = $getIDs->get_result();

      if ($result->num_rows === 0) {
          throw new Exception('Supplier relationship not found');
      }

      $row = $result->fetch_assoc();
      $supplierId = $row['supplier_id'];
      $supplyInventoryId = $row['supply_inventory_id'];
      $ingredientId = $row['ingredient_id'];

      // 1. Soft delete supply_supplier relationship
      $deleteSupplySupplier = $conn->prepare("UPDATE supply_supplier SET is_active = 0 WHERE supply_supplier_id = ?");
      $deleteSupplySupplier->bind_param("i", $supplySupplierID);
      $deleteSupplySupplier->execute();

      // 2. Soft delete supplier (only if no other active relationships exist)
      $checkSupplierUsage = $conn->prepare("SELECT COUNT(*) as count FROM supply_supplier WHERE supplier_id = ? AND is_active = 1");
      $checkSupplierUsage->bind_param("i", $supplierId);
      $checkSupplierUsage->execute();
      $supplierUsageResult = $checkSupplierUsage->get_result();
      $supplierUsageRow = $supplierUsageResult->fetch_assoc();

      if ($supplierUsageRow['count'] == 0) {
          $deleteSupplier = $conn->prepare("UPDATE supplier SET is_active = 0 WHERE supplier_id = ?");
          $deleteSupplier->bind_param("i", $supplierId);
          $deleteSupplier->execute();
      }

      // 3. Soft delete supply_inventory (only if no other active relationships exist)
      $checkSupplyInventoryUsage = $conn->prepare("SELECT COUNT(*) as count FROM supply_supplier WHERE supply_inventory_id = ? AND is_active = 1");
      $checkSupplyInventoryUsage->bind_param("i", $supplyInventoryId);
      $checkSupplyInventoryUsage->execute();
      $supplyInventoryUsageResult = $checkSupplyInventoryUsage->get_result();
      $supplyInventoryUsageRow = $supplyInventoryUsageResult->fetch_assoc();

      if ($supplyInventoryUsageRow['count'] == 0) {
          $deleteSupplyInventory = $conn->prepare("UPDATE supply_inventory SET is_active = 0 WHERE supply_inventory_id = ?");
          $deleteSupplyInventory->bind_param("i", $supplyInventoryId);
          $deleteSupplyInventory->execute();
      }

      // 4. Soft delete ingredient (only if not used elsewhere)
      $checkIngredientUsage = $conn->prepare("
          SELECT
              (SELECT COUNT(*) FROM supply_inventory WHERE ingredient_id = ? AND is_active = 1) +
              (SELECT COUNT(*) FROM product_ingredient WHERE ingredient_id = ? AND is_active = 1) +
              (SELECT COUNT(*) FROM add_on WHERE ingredient_id = ? AND is_active = 1) as total_count
      ");
      $checkIngredientUsage->bind_param("iii", $ingredientId, $ingredientId, $ingredientId);
      $checkIngredientUsage->execute();
      $ingredientUsageResult = $checkIngredientUsage->get_result();
      $ingredientUsageRow = $ingredientUsageResult->fetch_assoc();

      if ($ingredientUsageRow['total_count'] == 0) {
          $deleteIngredient = $conn->prepare("UPDATE ingredient SET is_active = 0 WHERE ingredient_id = ?");
          $deleteIngredient->bind_param("i", $ingredientId);
          $deleteIngredient->execute();
      }

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Supplier removed successfully']);

  } catch (Exception $e) {
      $conn->rollback();
      throw $e;
  }
}
?>