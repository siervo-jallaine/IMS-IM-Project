<?php

$host = "localhost";
$db_user = "root";
$db_pass = "";
$dbname = "inventory_management_system";

$conn = new mysqli($host, $db_user, $db_pass, $dbname);
$conn->query("SET time_zone = '+08:00'");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>