[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly ]

<div class="muliselect-container" style="--option-count: ${configuration.numberOfOptions!}">
	<div class="custom-checkbox custom-control [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<span
			class="d-block font-weight-semi-bold mb-2 multiselect-list-label text-3 [#if !input.showLabel || !input.label?has_content]sr-only[/#if]"
			id="${fragmentEntryLinkNamespace}-multiselect-list-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif
			input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</span>

		<div class="lists-container">
			<div class="list">
				<label for="${input.name}-available" class="d-block mb-1 text-secondary">Available</label>
				[#if configuration.orderOptionsAlphabetically]
				[#assign options=(input.attributes.options?sort_by("label"))![]]
				[#else]
				[#assign options=(input.attributes.options)![]]
				[/#if]
				<select class="list-avaialble-options" size="${configuration.numberOfOptions!}" name="${input.name}-available" multiple>
					[#list options as option]
					<option value="${option.value}">${htmlUtil.escape(option.label)}</option>
					[/#list]
				</select>
			</div>

			<div class="buttons">
				[#if configuration.showAllButtons]
				<button class="btn btn-sm btn-${configuration.buttonType!} btn-move-all-right"> &gt;&gt; </button>
				[/#if]
				<button class="btn btn-sm btn-${configuration.buttonType!} btn-move-right"> &gt; </button>
				<button class="btn btn-sm btn-${configuration.buttonType!} btn-move-left"> &lt; </button>
				[#if configuration.showAllButtons]
				<button class="btn btn-sm btn-${configuration.buttonType!} btn-move-all-left"> &lt;&lt; </button>
				[/#if]
			</div>

			<div class="list">
				<label for="${input.name}" class="d-block mb-1 text-secondary">Selected</label>
				<select class="list-selected-options" size="${configuration.numberOfOptions!}"
					${input.required?then('required', '' )} name="${input.name}" multiple>
				</select>
			</div>
		</div>
		[#if input.showHelpText && input.helpText?has_content]
		<p class="mb-0 mt-1 text-secondary" id="${fragmentEntryLinkNamespace}-help-text">
			${input.helpText}
		</p>
		[/#if]
	</div>