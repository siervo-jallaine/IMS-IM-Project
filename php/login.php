<?php
// Secure session settings
ini_set('session.cookie_lifetime', 0);
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

session_start();
include 'db_connection.php';

// ✅ Redirect if already logged in
if (isset($_SESSION['username']) && isset($_SESSION['role'])) {
    if ($_SESSION['role'] === 'admin') {
        header("Location: admin.php");
        exit();
    } else if ($_SESSION['role'] === 'staff') {
        header("Location: staff.php");
        exit();
    }
}

// ✅ Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT * FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if ($password === $user['password_hash']) { // Consider hashing in production
            session_regenerate_id(true);
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['logged_in'] = true;

            if ($user['role'] === 'admin') {
                header("Location: admin.php");
            } else {
                header("Location: staff.php");
            }
            exit();
        } else {
            $error = "Incorrect password.";
        }
    } else {
        $error = "Account not found.";
    }
}
?>

<!-- HTML below (formerly in login.html) -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Amacio's Coffee Shop Inventory System - Login</title>
    <link rel="stylesheet" href="../css/login.css">
</head>
<body>
    <div class="container">
        <div class="left-section">
            <div class="branding-logo">
                <img src="../assets/logo_cafe.png" alt="Logo" class="logo-image">
            </div>
            <div class="system-title">Amacio's Coffee Shop Inventory System</div>
        </div>

        <div class="right-section">
            <form class="login-card" id="loginForm" action="login.php" method="POST" novalidate>
                <h2>LOG IN</h2>

                <?php if (!empty($error)): ?>
                    <div class="error-message" style="color: red;"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <div class="form-group">
                    <label for="emailInput">Email</label>
                    <input type="email" id="emailInput" name="email" required placeholder="example@gmail.com">
                </div>

                <div class="form-group">
                    <label for="passwordInput">Password</label>
                    <input type="password" id="passwordInput" name="password" required placeholder="Enter your password">
                </div>

                <button type="submit" class="sign-in-btn" id="signInBtn">Sign In</button>
            </form>
        </div>
    </div>

    <script src="../js/login.js"></script>
</body>
</html>
