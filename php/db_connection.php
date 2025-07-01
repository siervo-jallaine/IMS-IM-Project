<?php
$host = "localhost";
$db_user = "root";
$db_pass = "";
$dbname = "inventory_management_system";

// MySQLi connection (for legacy or existing code like suppliers)
$conn = new mysqli($host, $db_user, $db_pass, $dbname);
$conn->query("SET time_zone = '+08:00'");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// PDO connection (for user_management.php and new code)
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+08:00'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'PDO connection failed: ' . $e->getMessage()]);
    exit;
}
?>
