<div class="intranet-feed">
  <div
    class="intranet-feed-header d-flex justify-content-between align-items-center mb-4"
  >
    <h2
      class="intranet-feed-section-title mb-0"
      data-lfr-editable-id="feed-title"
      data-lfr-editable-type="text"
    >
      My Feed
    </h2>
    [#if configuration.viewAllURL?? && configuration.viewAllURL != ""]
    <a href="${configuration.viewAllURL}" class="intranet-feed-view-all"
      >${languageUtil.get(locale, "view-all")}</a
    >
    [/#if]
  </div>

  <!-- Create Post Area -->
  <div class="intranet-feed-composer mb-4">
    <div class="d-flex align-items-center p-3">
      <div class="intranet-feed-avatar mr-3">
        <img
          src="/o/classic-theme/images/user_icon.png"
          alt="User Avatar"
          class="rounded-circle"
        />
      </div>
      <div
        class="intranet-feed-input-placeholder flex-grow-1"
        data-lfr-editable-id="feed-placeholder"
        data-lfr-editable-type="text"
      >
        Start a post
      </div>
      <div class="intranet-feed-composer-actions ml-3">
        <button class="btn btn-outline-secondary btn-sm mr-2">
          [@clay["icon"] symbol="picture" /]
        </button>
        <button class="btn btn-outline-secondary btn-sm mr-2">
          [@clay["icon"] symbol="paperclip" /]
        </button>
        <button class="btn btn-primary btn-sm intranet-feed-post-btn">
          Post
        </button>
      </div>
    </div>
  </div>

  <!-- Feed Items Container -->
  <div class="intranet-feed-items">
    <div class="intranet-feed-item p-3 mb-3 border rounded">
      <div class="d-flex mb-3">
        <div class="intranet-feed-avatar mr-3">
          <img
            src="https://i.pravatar.cc/150?u=sarah"
            alt="Author Avatar"
            class="rounded-circle"
          />
        </div>
        <div>
          <div class="intranet-feed-item-author font-weight-bold">
            Sarah Shepherd
          </div>
          <div class="intranet-feed-item-meta text-muted small">
            Sr. Product Manager • 10 hours ago
          </div>
        </div>
      </div>
      <div class="intranet-feed-item-content mb-3">
        <strong>The Quarterly Roadmap Update</strong><br />
        After analyzing the usage data from our top 50 clients, we are pivoting
        our Q4 focus...
      </div>
      <div class="intranet-feed-item-actions d-flex align-items-center">
        <button class="btn btn-link btn-sm p-0 mr-3 text-muted">
          [@clay["icon"] symbol="thumbs-up" /] 48
        </button>
        <button class="btn btn-link btn-sm p-0 mr-3 text-muted">
          [@clay["icon"] symbol="comments" /] 6
        </button>
        <button class="btn btn-link btn-sm p-0 text-muted ml-auto">
          [@clay["icon"] symbol="share" /]
        </button>
      </div>
    </div>
  </div>

  <div class="meta-editor-mappable-fields">
    <div class="mappable-field-item">
      <label>Object API Path</label>
      <div
        data-lfr-editable-id="feed-object-path"
        data-lfr-editable-type="text"
      >
        /o/c/posts
      </div>
    </div>
  </div>
</div>
