<div class="stat-card">
  <h3 class="stat-card-title">${configuration.title!''}</h3>
  <div class="stat-card-value-container">
    <span class="stat-card-value">${configuration.value!''}</span>
    [#if configuration.trend?? && configuration.trend != ""]
    <span class="stat-card-trend">${configuration.trend}</span>
    [/#if]
  </div>
</div>
