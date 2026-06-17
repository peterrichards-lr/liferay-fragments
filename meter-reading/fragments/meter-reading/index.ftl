[#-- prettier-ignore --]
[#assign
	labels = (configuration.labelList!"")?split(";")
	input = {
		"errorMessage": (input.errorMessage)!"",
		"showLabel": (input.showLabel)!true,
		"label": (input.label)!"Meter Reading",
		"required": (input.required)!false,
		"name": (input.name)!"meterReading",
		"readOnly": (input.readOnly)!false
	}
    integerDigitCount = configuration.integerDigitCount!5
    decimalDigitCount = configuration.decimalDigitCount!1
    totalDigits = 6
/]

<div class="meter-reading meter-reading-content">
    <div class="singleton-error d-none alert alert-danger">
        Collision detected: Multiple instances of Meter Reading found.
    </div>

	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]">
			${htmlUtil.escape(input.label)} [#if input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

        <form>
            <div class="reading meter-container d-flex">
                [#list 1..totalDigits as i]
                    [#assign isDecimal = (i > integerDigitCount?number) /]
                    <label class="digit meter-digit [#if isDecimal]dec[#else]int[/#if]">
                        <input 
                            class="form-control digit [#if isDecimal]dec[#else]int[/#if]" 
                            type="text" 
                            maxlength="1" 
                            size="1"
                            digit="${i}"
                            name="${input.name}" 
                            id="${fragmentEntryLinkNamespace}-digit-${i}"
                            [#if input.readOnly]readonly[/#if]
                            ${input.required?then('required', '')}
                        />
                        [#if (i-1) < labels?size]
                            <span class="small text-muted d-block">${labels[i-1]?trim}</span>
                        [/#if]
                    </label>
                [/#list]
            </div>

            <div class="date-input mt-3 [#if !configuration.showDateSelector]hide-date-selector[/#if]">
                <label for="${fragmentEntryLinkNamespace}-date">[@liferay.language key="lfr.meter-reading.date-of-reading" /]</label>
                <input class="form-control date" type="date" id="${fragmentEntryLinkNamespace}-date" />
            </div>

            <div class="control mt-3">
                <span class="status"></span>
                <button class="btn btn-primary" type="submit">[@liferay.language key="lfr.meter-reading.submit-reading" /]</button>
            </div>
        </form>

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]
        
        <div class="error-container alert alert-danger d-none mt-2"></div>
	</div>
</div>
