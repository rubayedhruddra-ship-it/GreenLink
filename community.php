<?php $title='Community - GreenLink'; include __DIR__ . '/inc/header.php'; ?>
<link rel="stylesheet" href="recycle.css">
<link rel="stylesheet" href="cm.css">
<main class="community-wrapper">
  <section class="community-head">
    <h1>Gardening Community</h1>
    <p>Share gardening tips, showcase your plants, and connect with eco-minded neighbors.</p>
  </section>

  <section class="composer card">
    <div class="composer-body">
      <img id="composerAvatar" class="avatar" src="IMG/user.png" alt="Your avatar">
      <textarea id="postText" placeholder="Share a gardening tip or photo…" rows="3"></textarea>
    </div>

    <div class="composer-actions">
      <div class="left">
        <label class="add-photo">
          <i data-feather="image"></i> Add Photo
          <input type="file" accept="image/*" id="imgInput">
        </label>

        <div id="imgPreview" class="img-preview" aria-hidden="true"></div>
      </div>

      <button id="postBtn" class="btn btn--primary"><i data-feather="plus"></i> Post</button>
    </div>
  </section>

  <section id="feed"></section>
</main>
<script src="cm.js" defer></script>
<?php include __DIR__ . '/inc/footer.php'; ?>