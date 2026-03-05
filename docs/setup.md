# Prerequisites & Environment Setup

In order for these fragments to function correctly, particularly for guest/anonymous users or for those requiring advanced FreeMarker features, the following Liferay configurations are necessary.

---

## 1. Service Access Policies (SAP)

Many fragments (e.g., `Content Map`, `Hero Assets`, `Public Comments`) use Headless APIs to fetch data. By default, these APIs are restricted for Guest users.

### Required Service Signatures:
Navigate to **Control Panel -> Security -> Service Access Policy**. Create or update a policy (e.g., `GUEST_READ`) with the following signatures based on the fragments you use:

*   **Content Map**:
    *   `com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl#getContentSetContentSetElementsPage`
    *   `com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl#getSiteContentSetByKeyContentSetElementsPage`
    *   `com.liferay.headless.admin.taxonomy.internal.resource.v1_0.BaseTaxonomyCategoryResourceImpl#getTaxonomyVocabularyTaxonomyCategoriesPage`
    *   `com.liferay.headless.delivery.internal.resource.v1_0.ContentTemplateResourceImpl#getSiteContentTemplate`
*   **Hero Assets / Documents**:
    *   `com.liferay.headless.delivery.internal.resource.v1_0.DocumentResourceImpl#getDocument`
*   **Object Integrations**:
    *   Ensure the specific Object's REST API is enabled for Guest permissions in the Object's "Permissions" tab.

---

## 2. FreeMarker Engine Configuration

Some advanced fragments require access to Java utility classes (like `PortalUtil` or `ServiceContextThreadLocal`). By default, Liferay restricts these for security.

### Enabling `staticUtil`:
1.  Navigate to **Control Panel -> System Settings -> Template Engines (under Platform) -> FreeMarker Engine**.
2.  Locate the **Restricted Variables** list.
3.  Remove `staticUtil` from the list.
4.  Save the changes.

*Note: This is specifically required for legacy versions of the `Date Display` and some complex `Object` integrations.*

---

## 3. Client Extensions

Fragments in the `Pulse` and `OAuth2` collections depend on JavaScript Client Extensions to provide helper utilities.

*   **Pulse Integration**: Requires the `pulse-helper` JS client extension to be present on the page or included in the site's global JS.
*   **OAuth2 / User Accounts**: Requires a **User Agent Application** to be configured in Liferay (under OAuth2 Administration) and its "Reference Code" provided in the fragment configuration.

---

## 4. Showcase Data

To showcase data-driven fragments like the `Object-Linked Chart`, `Activity Heatmap`, and `Interactive Event Timeline`, multiple sample Object definitions and datasets are provided.

**Note: Liferay 2025.Q4.10 or later is required for the showcase data to work correctly, as it utilizes site-scoping (`siteExternalReferenceCode: L_GUEST`).**

### Deployment:
1.  **Direct Deployment**: Build the showcase ZIPs using `./create-fragment-zips.sh` and deploy them using `./deploy-fragment-zips.sh [TARGET_PATH] --showcase`.
2.  **Organization**: All showcase datasets are located in `/other-resources/showcase-data/`, including:
    *   **Activity Log**: For the `Activity Heatmap`.
    *   **Product Showcase**: For the `Dynamic Object Gallery`.
    *   **Company Milestones**: For the `Interactive Event Timeline`.
    *   **Water Readings**: For the `Meter Reading` and `Object-Linked Chart`.

### Showcase Data & Liferay CX Conventions

To ensure the showcase datasets are correctly imported by the Liferay Batch Engine and compatible with the automated deployment scripts, please observe the following:

1.  **Showcase ERC Convention (Project-Specific)**: Within this repository, the External Reference Code (ERC) for sample Objects follows a naming convention: uppercase with underscores (e.g., `COMPANY_MILESTONE`). This is for internal consistency and is not a Liferay platform requirement.
2.  **`taskItemDelegateName` (Liferay CX Mandatory Rule)**: For the Liferay Batch Engine to process Object entry imports, the `taskItemDelegateName` property must be explicitly defined within the `configuration` object of the JSON batch file. It must be set to the Object's name with a `C_` prefix (e.g., `"taskItemDelegateName": "C_CompanyMilestone"`).

