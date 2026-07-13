<div class="fragment-interactive-floorplan">
	<div class="floorplan-container">
		<img src="[#if configuration.backgroundImage?has_content]${configuration.backgroundImage}[#else]https://via.placeholder.com/800x600[/#if]" class="floorplan-bg" alt="Floorplan" />
		<div class="pins-layer"></div>
	</div>
	
	[#if configuration.allowCreation]
	<dialog class="new-pin-modal">
		<form method="dialog" class="pin-form">
			<div class="modal-header">
				<h3>New Annotator Pin</h3>
				<button type="button" class="close-modal">&times;</button>
			</div>
			<div class="modal-body">
				<div class="form-group">
					<label for="pinTitle">Title</label>
					<input type="text" id="pinTitle" name="title" required class="form-control" />
				</div>
				<div class="form-group">
					<label for="pinDescription">Description</label>
					<textarea id="pinDescription" name="description" required class="form-control"></textarea>
				</div>
				<input type="hidden" id="pinX" name="xCoord" />
				<input type="hidden" id="pinY" name="yCoord" />
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary close-modal-btn">Cancel</button>
				<button type="submit" class="btn btn-primary submit-pin">Save Pin</button>
			</div>
		</form>
	</dialog>
	[/#if]
</div>