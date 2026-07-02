[#-- prettier-ignore --]
[#assign
    lfrInput = input!{}
	labels = ((configuration.labelList)!"")?split(";")
	input = {
		"errorMessage": (lfrInput.errorMessage)!"",
		"showLabel": (lfrInput.showLabel)!true,
		"label": (lfrInput.label)!"Meter Reading",
		"required": (lfrInput.required)!false,
		"name": (lfrInput.name)!"meterReading",
		"readOnly": (lfrInput.readOnly)!false
	}
    integerDigitCount = (configuration.integerDigitCount)!5
    decimalDigitCount = (configuration.decimalDigitCount)!3
    showDateSelector = ((configuration.showDateSelector)!false)?is_string?then(((configuration.showDateSelector)!"") == "true", (configuration.showDateSelector)!false)
/]
[#if integerDigitCount?is_string][#assign integerDigitCount = integerDigitCount?number][/#if]
[#if decimalDigitCount?is_string][#assign decimalDigitCount = decimalDigitCount?number][/#if]
[#assign totalDigits = integerDigitCount + decimalDigitCount /]

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
                <div class="integer-group d-flex">
                    [#list 1..totalDigits as i]
                        [#if i <= integerDigitCount]
                            [#assign isDecimal = false /]
                            <label class="digit meter-digit int">
                                <input 
                                    class="form-control digit int" 
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
                        [/#if]
                    [/#list]
                </div>
                [#if decimalDigitCount > 0]
                    <div class="decimal-group d-flex">
                        [#list 1..totalDigits as i]
                            [#if i > integerDigitCount]
                                [#assign isDecimal = true /]
                                <label class="digit meter-digit dec">
                                    <input 
                                        class="form-control digit dec" 
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
                            [/#if]
                        [/#list]
                    </div>
                [/#if]
            </div>

            <div class="date-input mt-3 [#if !showDateSelector]hide-date-selector[/#if]">
                <label for="${fragmentEntryLinkNamespace}-date">[@liferay.language key="lfr.meter-reading.date-of-reading" /]</label>
                <input class="form-control date" type="date" id="${fragmentEntryLinkNamespace}-date" />
            </div>

            <div class="control mt-3">
                <span class="status"></span>
                <button class="btn btn-${(configuration.buttonSize)!'nm'} btn-${(configuration.buttonType)!'primary'}" type="submit">[@liferay.language key="lfr.meter-reading.submit-reading" /]</button>
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
