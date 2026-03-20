<div class="modern-search-overlay" id="search-${fragmentEntryLinkNamespace}" style="--overlay-bg: ${configuration.overlayBgColor}; --accent-color: ${configuration.accentColor}">
    <!-- Trigger Button -->
    <button class="btn btn-monospaced btn-secondary search-trigger" type="button" aria-label="${configuration.buttonLabel!"Search"}" title="${configuration.buttonLabel!"Search"}">
        <svg class="lexicon-icon lexicon-icon-search" role="presentation" viewBox="0 0 512 512">
            <use xlink:href="${siteSpritemap}#search"></use>
        </svg>
    </button>

    <!-- Full Screen Overlay -->
    <div class="search-modal d-none" role="dialog" aria-modal="true" aria-label="Search Portal">
        <div class="search-modal-header d-flex align-items-center">
            <div class="container d-flex align-items-center">
                <svg class="lexicon-icon lexicon-icon-search search-icon-lg" role="presentation">
                    <use xlink:href="${siteSpritemap}#search"></use>
                </svg>
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="${configuration.placeholder!}" 
                    aria-label="Search Input"
                    autocomplete="off"
                />
                <button class="btn btn-link close-search" type="button" aria-label="Close Search">
                    <svg class="lexicon-icon lexicon-icon-times" role="presentation">
                        <use xlink:href="${siteSpritemap}#times"></use>
                    </svg>
                </button>
            </div>
        </div>

        <div class="search-modal-body">
            <div class="container">
                <!-- Results Sections -->
                <div class="results-container row mt-5">
                    <div class="col-12 text-center initial-message py-5">
                        <p class="text-muted">Start typing to see results...</p>
                    </div>
                    <div class="col-12 loading-spinner d-none text-center py-5">
                        <span class="loading-animation"></span>
                    </div>
                    <div class="results-list col-12 d-none">
                        <!-- Categorized results injected here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
