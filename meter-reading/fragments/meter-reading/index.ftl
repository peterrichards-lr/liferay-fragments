[#-- prettier-ignore --]
[#assign
	labels = (configuration.labelList!"")?split(";")
/]

<div class="meter-reading">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-meter-input">
			${htmlUtil.escape(input.label)} [#if input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="meter-container d-flex">
			[#list 1..6 as i]
				<label class="meter-digit">
					[#-- prettier-ignore --]
					<input 
						class="form-control" 
						type="text" 
						maxlength="1" 
						name="${input.name}" 
						id="digit-${i}"
						[#if input.readOnly]readonly[/#if]
						${input.required?then('required', '')}
					/>
					[#if (i-1) < labels?size]
						<span class="small text-muted d-block">${labels[i-1]?trim}</span>
					[/#if]
				</label>
			[/#list]
		</div>

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]
	</div>
</div>
