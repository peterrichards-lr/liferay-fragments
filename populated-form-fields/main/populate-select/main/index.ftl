[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="populate-select-fragment">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-select-from-list-input" id="${fragmentEntryLinkNamespace}-select-from-list-input-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		[#if readOnly]
			<input 
				aria-describedby="${fragmentEntryLinkNamespace}-help-text" 
				class="form-control" 
				id="${fragmentEntryLinkNamespace}-select-from-list-input" 
				name="${input.name}" 
				readonly 
				type="text" 
				[#if input.value??]value="${input.value}"[/#if] 
			/>
		[#else]
			<div class="align-items-end input-group">
				<select 
					class="form-control" 
					id="${fragmentEntryLinkNamespace}-select-from-list-input" 
					name="${input.name}"
					${input.required?then('required', '')}
				>
					<option value="">${languageUtil.get(locale, "choose-an-option")}</option>
					[#list (input.attributes.options)![] as option]
						<option [#if input.value?? && option.value == input.value]selected[/#if] value="${option.value}">${htmlUtil.escape(option.label)}</option>
					[/#list]
				</select>
			</div>
		[/#if]

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger" id="${fragmentEntryLinkNamespace}-select-from-list-input-error-message">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]
	</div>
</div>
