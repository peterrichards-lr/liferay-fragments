<div class="course-card">
  <div class="row no-gutters align-items-center">
    <!-- Image -->
    <div class="col-md-2 col-sm-3">
      <div
        class="course-card-image-container"
        data-lfr-editable-id="course-image"
        data-lfr-editable-type="image"
      >
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400"
          alt="Course Thumbnail"
          class="course-card-image"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="col-md-6 col-sm-6 p-4">
      <h3
        class="course-card-title mb-2"
        data-lfr-editable-id="course-title"
        data-lfr-editable-type="text"
      >
        Q3 Product Strategy
      </h3>
      <p
        class="course-card-description mb-0 text-muted small"
        data-lfr-editable-id="course-description"
        data-lfr-editable-type="text"
      >
        Deep dive into the revised Q3 roadmap, OKRs, and market trends for the
        upcoming quarter.
      </p>
    </div>

    <!-- Progress & Action -->
    <div class="col-md-4 col-sm-3 p-4 border-left">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span
          class="course-card-progress-label small font-weight-bold text-primary"
        >
          <span
            data-lfr-editable-id="course-progress-text"
            data-lfr-editable-type="text"
            >30%</span
          >
          Completed
        </span>
      </div>
      <div class="progress course-card-progress mb-4">
        <div
          class="progress-bar"
          role="progressbar"
          style="width: 30%"
          aria-valuenow="30"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <a
        href="${configuration.buttonURL!'#'}"
        class="btn btn-primary btn-block course-card-btn"
      >
        ${configuration.buttonLabel!'Continue'}
      </a>
    </div>
  </div>

  <div class="meta-editor-mappable-fields">
    <div class="mappable-field-item">
      <label>Progress Percentage (0-100)</label>
      <div
        data-lfr-editable-id="course-progress-value"
        data-lfr-editable-type="text"
      >
        30
      </div>
    </div>
  </div>
</div>
