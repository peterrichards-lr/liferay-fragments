<div class="loan-application-calculator-container">
  [#if layoutMode == "edit"]
    <div class="alert alert-info small py-1 px-2 mb-2 d-none" id="loanAppHelp">
      Please drop two 'Range' fragments into the drop-zone and set their Reference IDs to <code>loanAmount</code> and <code>loanTerm</code>.
    </div>
  [/#if]
  <lfr-drop-zone data-lfr-drop-zone-id="1"></lfr-drop-zone>
  <div class="summary mt-4 p-4 bg-light rounded">
    <h3 class="component-text h3 mb-2 text-break">
      ${configuration.title!"Summary"}
    </h3>
    <p id="summaryText" class="component-text text-paragraph mb-1 text-break">
      You will pay back a total of <strong>$<span id="totalPayment">0.00</span></strong> over
      <strong><span id="termMonths">0</span> months</strong> at a rate of
      <strong><span id="interestRate">0.0%</span></strong> representative.
    </p>
    <p class="text-muted small mb-0">The actual rate you receive will be tailored to you.</p>
  </div>
</div>
