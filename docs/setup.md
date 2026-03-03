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
