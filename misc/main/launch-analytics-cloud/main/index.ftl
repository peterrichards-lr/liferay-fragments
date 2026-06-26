[#-- prettier-ignore --]
[#assign
  headingTag = configuration.headingLevel!'h2'
/]

<${headingTag}
	class="analytics-launch-title"
	data-lfr-editable-id="title"
	data-lfr-editable-type="text"
>
	Analytics Cloud
</${headingTag}>

<div class="${configuration.height!}"></div>

<div class="component-button text-break">
	<a
		class="btn btn-${configuration.buttonSize!} btn-${configuration.buttonType!}"
		data-lfr-editable-id="link"
		data-lfr-editable-type="link"
		href=""
		id="fragment-${fragmentEntryLinkNamespace}-link"
	>
		Launch
	</a>
</div>
