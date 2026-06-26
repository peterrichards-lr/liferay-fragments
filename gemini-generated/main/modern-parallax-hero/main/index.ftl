[#assign youtubeId = ""]
[#if configuration.backgroundVideoUrl?? && configuration.backgroundVideoUrl?contains("v=")]
  [#assign youtubeId = configuration.backgroundVideoUrl?keep_after("v=")]
  [#if youtubeId?contains("&")]
    [#assign youtubeId = youtubeId?keep_before("&")]
  [/#if]
[#elseif configuration.backgroundVideoUrl?? && configuration.backgroundVideoUrl?contains("youtu.be/")]
  [#assign youtubeId = configuration.backgroundVideoUrl?keep_after("youtu.be/")]
  [#if youtubeId?contains("?")]
    [#assign youtubeId = youtubeId?keep_before("?")]
  [/#if]
[#elseif configuration.backgroundVideoUrl?? && configuration.backgroundVideoUrl?contains("embed/")]
  [#assign youtubeId = configuration.backgroundVideoUrl?keep_after("embed/")]
  [#if youtubeId?contains("?")]
    [#assign youtubeId = youtubeId?keep_before("?")]
  [/#if]
[/#if]

<div
  class="parallax-hero hero-container-${fragmentEntryLinkNamespace}"
  style="
    --hero-height: ${configuration.height!};
    --text-color: ${configuration.textColor!};
    --overlay-color: ${configuration.overlayColor!};
  "
>
  <div
    class="alert alert-info d-none mb-3"
    id="info-${fragmentEntryLinkNamespace}"
    style="
      position: absolute;
      top: var(--spacer-4);
      left: var(--spacer-4);
      z-index: 10;
      width: calc(100% - 2 * var(--spacer-4));
    "
  ></div>
  <div
    class="alert alert-danger d-none mb-3"
    id="error-${fragmentEntryLinkNamespace}"
    style="
      position: absolute;
      top: var(--spacer-4);
      left: var(--spacer-4);
      z-index: 10;
      width: calc(100% - 2 * var(--spacer-4));
    "
  ></div>

  <div class="parallax-bg">
    [#if configuration.backgroundVideo?? && configuration.backgroundVideo.url??]
      <video
        autoplay
        muted
        loop
        playsinline
        class="parallax-media"
        src="${configuration.backgroundVideo.url}"
      ></video>
    [#else]
      <img
        data-lfr-editable-id="background-image"
        data-lfr-editable-type="image"
        class="parallax-media"
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
        alt="Background"
      />
    [/#if]
  </div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1
      class="hero-title"
      data-lfr-editable-id="hero-title"
      data-lfr-editable-type="text"
    >
      Modern Meridian Experience
    </h1>
    <p
      class="hero-subtitle"
      data-lfr-editable-id="hero-subtitle"
      data-lfr-editable-type="text"
    >
      Discover the future of digital portals with our next-generation
      components.
    </p>

    [#if youtubeId?has_content]
      <div class="hero-video-wrapper my-4 mx-auto" style="max-width: 560px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${youtubeId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="border: none;"
        ></iframe>
      </div>
    [/#if]

    <div class="hero-actions">
      <lfr-drop-zone></lfr-drop-zone>
    </div>
  </div>
</div>
