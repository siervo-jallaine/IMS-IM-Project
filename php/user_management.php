<?php
// user_management.php - Backend API for User Management
include 'db_connection.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                getUserList($pdo);
            } elseif ($action === 'get' && isset($_GET['id'])) {
                getUser($pdo, $_GET['id']);
            }
            break;

        case 'POST':
            if ($action === 'create') {
                createUser($pdo);
            }
            break;

        case 'PUT':
            if ($action === 'update' && isset($_GET['id'])) {
                updateUser($pdo, $_GET['id']);
            }
            break;

        case 'DELETE':
            if ($action === 'delete' && isset($_GET['id'])) {
                deleteUser($pdo, $_GET['id']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getUserList($pdo) {
    $stmt = $pdo->prepare("
        SELECT user_id, username, email, role, is_active
        FROM user
        WHERE is_active = 1
        ORDER BY username ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $users]);
}

function getUser($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT user_id, username, email, role, is_active
        FROM user
        WHERE user_id = ? AND is_active = 1
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['success' => true, 'data' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }
}

function createUser($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($input['username']) || empty($input['email']) || empty($input['password']) || empty($input['role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    // Check if username or email already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user WHERE (username = ? OR email = ?) AND is_active = 1");
    $stmt->execute([$input['username'], $input['email']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Username or email already exists']);
        return;
    }

    // Hash the password
    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO user (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, 1)
    ");

    if ($stmt->execute([$input['username'], $input['email'], $passwordHash, $input['role']])) {
        $userId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'message' => 'User created successfully', 'user_id' => $userId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user']);
    }
}

function updateUser($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($input['username']) || empty($input['email']) || empty($input['role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    // Check if username or email already exists for other users
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user WHERE (username = ? OR email = ?) AND user_id != ? AND is_active = 1");
    $stmt->execute([$input['username'], $input['email'], $userId]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Username or email already exists']);
        return;
    }

    // Prepare update query
    $updateFields = ['username = ?', 'email = ?', 'role = ?'];
    $params = [$input['username'], $input['email'], $input['role']];

    // Only update password if provided
    if (!empty($input['password'])) {
        $updateFields[] = 'password_hash = ?';
        $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
    }

    $params[] = $userId;

    $stmt = $pdo->prepare("
        UPDATE user
        SET " . implode(', ', $updateFields) . "
        WHERE user_id = ? AND is_active = 1
    ");

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user']);
    }
}

function deleteUser($pdo, $userId) {
    // Soft delete - set is_active to 0
    $stmt = $pdo->prepare("UPDATE user SET is_active = 0 WHERE user_id = ?");

    if ($stmt->execute([$userId])) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user']);
    }
}
?>