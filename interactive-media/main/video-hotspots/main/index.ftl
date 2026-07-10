<div class="fragment-video-hotspots">
	<div class="video-container">
		[#if configuration.videoUrl?has_content]
			<video src="${configuration.videoUrl}" autoplay loop muted playsinline></video>
		[/#if]

		[#if configuration.enableHotspot1]
			<a href="${configuration.hotspot1Link}" class="hotspot" style="left: ${configuration.hotspot1X}%; top: ${configuration.hotspot1Y}%;">
				<span class="hotspot-pulse"></span>
				<span class="hotspot-tooltip">${configuration.hotspot1Text}</span>
			</a>
		[/#if]

		[#if configuration.enableHotspot2]
			<a href="${configuration.hotspot2Link}" class="hotspot" style="left: ${configuration.hotspot2X}%; top: ${configuration.hotspot2Y}%;">
				<span class="hotspot-pulse"></span>
				<span class="hotspot-tooltip">${configuration.hotspot2Text}</span>
			</a>
		[/#if]

		[#if configuration.enableHotspot3]
			<a href="${configuration.hotspot3Link}" class="hotspot" style="left: ${configuration.hotspot3X}%; top: ${configuration.hotspot3Y}%;">
				<span class="hotspot-pulse"></span>
				<span class="hotspot-tooltip">${configuration.hotspot3Text}</span>
			</a>
		[/#if]
	</div>
</div>