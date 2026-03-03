# Finance Fragments

A collection of financial utility fragments, specifically designed for loan and repayment calculations.

## Loan Calculator

A comprehensive, interactive tool that allows users to estimate loan repayments based on a principal amount and a repayment term.

- **Interactive Sliders**: Users can adjust the loan amount (e.g., $1,000 to $50,000) and the repayment term (e.g., 6 to 60 months) using intuitive range inputs.
- **Real-Time Summary**: Dynamically calculates and displays the total repayment amount and interest rate as the user adjusts the inputs.
- **Singleton Enforcement**: To ensure a consistent user experience and prevent data conflicts, the fragment includes built-in detection to prevent multiple instances from being active on the same page.
- **Meridian Theme Integration**: Fully supports Meridian CSS tokens for consistent styling and accessibility.

## Loan Application Calculator

A specialized version of the calculator designed for use within a multi-step loan application process.

- **Contextual Integration**: Includes a drop zone for additional content or complementary fragments.
- **Application Summary**: Provides a clear summary of the user's current loan selection (Total Payment, Term, Interest Rate) to provide immediate feedback during the application journey.
