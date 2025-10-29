<?php
// Simple file-backed API for swap page (persistent JSON storage)
// When client calls swap.php?__api=1 this block handles GET/POST/DELETE actions.
// Keeps the rest of the file as the page view below.
if (isset($_GET['__api'])) {
  header('Content-Type: application/json; charset=utf-8');
  // simple session user detection (if you have app sessions)
  if (session_status() === PHP_SESSION_NONE) session_start();
  $currentUser = null;
  if (!empty($_SESSION['user'])) {
    $currentUser = $_SESSION['user'];
  } elseif (!empty($_SESSION['user_id']) || !empty($_SESSION['username'])) {
    $currentUser = [
      'id' => $_SESSION['user_id'] ?? null,
      'username' => $_SESSION['username'] ?? null,
      'avatar' => $_SESSION['avatar'] ?? ''
    ];
  }

  $file = __DIR__ . '/data/swaps.json';
  if (!file_exists(dirname($file))) @mkdir(dirname($file), 0755, true);
  if (!file_exists($file)) file_put_contents($file, json_encode(['items' => []], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));

  $raw = @file_get_contents($file);
  $data = json_decode($raw, true) ?: ['items' => []];
  $items = $data['items'] ?? [];

  $method = $_SERVER['REQUEST_METHOD'];
  $action = $_GET['action'] ?? '';

  // helpers
  $save = function($itemsArr) use ($file) {
    $out = ['items' => array_values($itemsArr)];
    file_put_contents($file, json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE), LOCK_EX);
    return $out;
  };

  // GET => return items
  if ($method === 'GET') {
    echo json_encode(['items' => $items]);
    exit;
  }

  // DELETE => delete an item by id
  if ($method === 'DELETE') {
    parse_str(file_get_contents("php://input"), $delVars);
    $id = $_GET['id'] ?? ($delVars['id'] ?? null);
    if ($id) {
      $items = array_filter($items, function($it) use ($id) { return strval($it['id']) !== strval($id); });
      $out = $save($items);
      echo json_encode(['ok' => true, 'items' => $out['items']]);
      exit;
    }
    echo json_encode(['error' => 'id required']);
    exit;
  }

  // POST actions: create post or handle JSON actions (request/accept/reject)
  if ($method === 'POST') {
    // JSON payload?
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
      $payload = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
      // regular form post
      $payload = $_POST;
    }

    // Create a request (from requester)
    if ($action === 'request') {
      $id = $_GET['id'] ?? null;
      if (!$id) { echo json_encode(['error' => 'id required']); exit; }
      $req = [
        'id' => uniqid('r_', true),
        'requester_id' => $payload['requester_id'] ?? ($currentUser['id'] ?? null),
        'requester' => $payload['requester'] ?? ($currentUser['username'] ?? 'Guest'),
        'offered' => $payload['offered'] ?? '',
        'message' => $payload['message'] ?? '',
        'email' => $payload['email'] ?? '',
        'phone' => $payload['phone'] ?? '',
        'status' => 'pending',
        'created_at' => date(DATE_ATOM)
      ];
      foreach ($items as &$it) {
        if (strval($it['id']) === strval($id)) {
          if (!isset($it['requests']) || !is_array($it['requests'])) $it['requests'] = [];
          $it['requests'][] = $req;
          break;
        }
      }
      $out = $save($items);
      echo json_encode(['ok' => true, 'items' => $out['items'], 'request' => $req]);
      exit;
    }

    // Accept a request (owner)
    if ($action === 'accept') {
      $id = $_GET['id'] ?? null;
      $request_id = $payload['request_id'] ?? null;
      $contact_email = $payload['contact_email'] ?? ($payload['email'] ?? '');
      $contact_phone = $payload['contact_phone'] ?? ($payload['phone'] ?? '');
      if (!$id || !$request_id) { echo json_encode(['error'=>'id+request_id required']); exit; }
      foreach ($items as &$it) {
        if (strval($it['id']) === strval($id)) {
          if (!isset($it['requests']) || !is_array($it['requests'])) $it['requests'] = [];
          foreach ($it['requests'] as &$r) {
            if (strval($r['id']) === strval($request_id)) {
              $r['status'] = 'accepted';
              $r['contact'] = ['email' => $contact_email, 'phone' => $contact_phone];
            }
          }
        }
      }
      $out = $save($items);
      echo json_encode(['ok' => true, 'items' => $out['items']]);
      exit;
    }

    // Reject a request
    if ($action === 'reject') {
      $id = $_GET['id'] ?? null;
      $request_id = $payload['request_id'] ?? null;
      if (!$id || !$request_id) { echo json_encode(['error'=>'id+request_id required']); exit; }
      foreach ($items as &$it) {
        if (strval($it['id']) === strval($id)) {
          if (!isset($it['requests']) || !is_array($it['requests'])) $it['requests'] = [];
          foreach ($it['requests'] as &$r) {
            if (strval($r['id']) === strval($request_id)) {
              $r['status'] = 'rejected';
            }
          }
        }
      }
      $out = $save($items);
      echo json_encode(['ok' => true, 'items' => $out['items']]);
      exit;
    }

    // Otherwise: create a new post (form-data allowed: title, category, condition, description, image)
    // Accept file upload and move to uploads/
    $title = trim($payload['title'] ?? '');
    if (!$title) { echo json_encode(['error' => 'title required']); exit; }
    $new = [
      'id' => uniqid('p_', true),
      'title' => $title,
      'category' => $payload['category'] ?? '',
      'condition' => $payload['condition'] ?? '',
      'description' => $payload['description'] ?? '',
      'image' => '',
      'created_at' => date(DATE_ATOM),
      'user_id' => $currentUser['id'] ?? ($payload['user_id'] ?? null),
      'username' => $currentUser['username'] ?? ($payload['username'] ?? 'Guest'),
      'avatar' => $currentUser['avatar'] ?? '',
      'requests' => []
    ];

    // handle image upload
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
      $up = $_FILES['image'];
      $ext = pathinfo($up['name'], PATHINFO_EXTENSION);
      $fn = 'swap_' . uniqid() . '.' . preg_replace('/[^a-z0-9]/i','', $ext);
      $dstDir = __DIR__ . '/uploads';
      if (!is_dir($dstDir)) @mkdir($dstDir, 0755, true);
      $dst = $dstDir . '/' . $fn;
      if (move_uploaded_file($up['tmp_name'], $dst)) {
        // store relative path for client
        $new['image'] = 'uploads/' . $fn;
      }
    }

    array_unshift($items, $new);
    $out = $save($items);
    echo json_encode(['ok' => true, 'items' => $out['items'], 'post' => $new]);
    exit;
  }

  echo json_encode(['error' => 'unsupported method']);
  exit;
}

// --- Page view continues below ---
require_once __DIR__ . '/inc/config.php';
$title = 'Swap - GreenLink';
include __DIR__ . '/inc/header.php';
?>
<link rel="stylesheet" href="swap.css">

<main class="swap-wrapper">
  <section class="swap-head">
    <h1>Swap — Share & Trade</h1>
    <p>Post items you want to swap. Request swaps from others. Manage requests in My Swaps / Requested tabs.</p>
  </section>

 
  <div class="global-search card" style="max-width:var(--max);margin:18px auto 8px;padding:10px 16px;display:flex;gap:.6rem;align-items:center;">
    <input id="searchGlobal" placeholder="Search items, category, user..." aria-label="Search swaps">
    <button id="clearSearch" class="btn">Clear</button>
  </div>

  <nav class="swap-tabs card" role="tablist" aria-label="Swap sections">
    <button class="tab-btn active" data-tab="list"><i data-feather="list"></i> List</button>
    <button class="tab-btn" data-tab="my-swaps"><i data-feather="user"></i> My Swaps</button>
    <button class="tab-btn" data-tab="requested"><i data-feather="inbox"></i> Requested</button>
  </nav>


  <section id="tab-list" class="tab-pane active">
    <section class="card compose">
      <h3 class="section-title"><i data-feather="plus-circle"></i> Create a Swap Post</h3>
      <div class="compose-grid">
        <div class="compose-left">
          <label class="field"><span>Title</span><input id="title" name="title" required></label>
          <div class="row2">
            <label class="field"><span>Category</span><input id="category" name="category" placeholder="e.g., Plants, Tools"></label>
            <label class="field"><span>Condition</span><input id="condition" name="condition" placeholder="New / Used"></label>
          </div>
          <label class="field"><span>Description</span><textarea id="description" name="description" rows="4" placeholder="Describe the item"></textarea></label>
          <div style="display:flex;justify-content:flex-end">
            <button id="createBtn" class="btn btn--primary">Post</button>
          </div>
        </div>

        <div class="compose-right">
          <label class="add-photo" for="image"><i data-feather="image"></i> Add Photo
            <input id="image" name="image" type="file" accept="image/*" hidden>
          </label>
          <div id="imgPreview" class="img-preview" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <section id="itemsGrid" class="grid" aria-live="polite" style="margin-top:1rem"></section>
  </section>

  <section id="tab-my-swaps" class="tab-pane">
    <section class="card">
      <h3 class="section-title"><i data-feather="user"></i> Requests I Made</h3>
      <div id="myRequestsList"></div>
    </section>
  </section>

  <section id="tab-requested" class="tab-pane">
    <section class="card">
      <h3 class="section-title"><i data-feather="inbox"></i> Requests To My Posts</h3>
      <div id="incomingRequestsList"></div>
    </section>
  </section>
</main>

<!-- Request modal: only ask for offered item now -->
<div id="modalRequest" class="modal" aria-hidden="true">
  <div class="modal__backdrop" data-close="modalRequest"></div>
  <div class="modal__dialog card">
    <h3>Request Swap</h3>
    <p id="modalItemTitle"></p>
    <label class="field"><span>Your offered item</span><input id="modalOffered" placeholder="e.g. 2x potted herbs" required></label>
    <div class="modal__actions">
      <button id="sendRequest" class="btn btn--primary">Send Request</button>
      <button data-close="modalRequest" class="btn">Cancel</button>
    </div>
  </div>
</div>

<!-- Approve modal -->
<div id="modalApprove" class="modal" aria-hidden="true">
  <div class="modal__backdrop" data-close="modalApprove"></div>
  <div class="modal__dialog card">
    <h3>Approve Request</h3>
    <p id="approveInfo"></p>
    <label class="field"><span>Contact email to share</span><input id="approveEmail" type="email" placeholder="contact@example.com"></label>
    <label class="field"><span>Contact phone (optional)</span><input id="approvePhone" placeholder="+1 555 0000"></label>
    <div class="modal__actions">
      <button id="confirmApprove" class="btn btn--primary">Confirm Approve</button>
      <button data-close="modalApprove" class="btn">Cancel</button>
    </div>
  </div>
</div>

<script>window.VIEW_USER_ID = null;</script>
<script src="swap.js" defer></script>
<?php include __DIR__ . '/inc/footer.php'; ?>