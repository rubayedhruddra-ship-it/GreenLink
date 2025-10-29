<?php
require_once __DIR__ . '/inc/config.php';
$title = 'Profile - GreenLink';
include __DIR__ . '/inc/header.php';


$viewId = null;
if (isset($_GET['id'])) {
  $viewId = intval($_GET['id']);
} else {
  $cu = function_exists('current_user') ? current_user() : null;
  $viewId = ($cu && isset($cu['id'])) ? intval($cu['id']) : null;
}
?>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="" crossorigin="anonymous">
<link rel="stylesheet" href="profile.css">

<main class="profile-wrapper">
  <section id="profileHeader" class="profile-card header-card">
    <div class="loading-fallback">
      <p>Loading profile…</p>
    </div>
  </section>



  <div class="profile-forms">
    <section id="editProfileSection" class="profile-card" style="display:none;"></section>
    <section id="passwordSection" class="profile-card" style="display:none;"></section>
  </div>


<script>window.VIEW_USER_ID = <?= $viewId === null ? 'null' : json_encode($viewId) ?>;</script>
<script src="profile.js" defer></script>

<?php include __DIR__ . '/inc/footer.php'; ?>
