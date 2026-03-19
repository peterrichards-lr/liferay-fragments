# Interactive Wizard

A versatile, multi-step journey component designed for onboarding, complex forms, or guided processes. It features a responsive progress indicator and smooth transitions between steps.

## Configuration

| Field               | Description                                        | Default           |
| :------------------ | :------------------------------------------------- | :---------------- |
| **Number of Steps** | Total number of steps in the wizard (2-10).        | 3                 |
| **Back Label**      | Text for the "Previous" button.                    | Back              |
| **Next Label**      | Text for the "Next" button.                        | Next              |
| **Finish Label**    | Text for the final step button.                    | Finish            |
| **Active Color**    | Color for the current step and completed progress. | `var(--primary)`  |
| **Inactive Color**  | Color for upcoming steps.                          | `var(--gray-300)` |

## Usage

1.  **Drop & Configure**: Add the fragment to a page and set the required number of steps.
2.  **Add Content**: Inside each step's drop zone, add the fragments or form fields required for that stage of the journey.
3.  **Progress Tracking**: The wizard automatically manages the visibility of panels and updates the progress bar as the user navigates.

## Visuals

![Interactive Wizard](../../docs/images/interactive-wizard.png)
_(Note: Upload screenshot to docs/images/interactive-wizard.png)_
