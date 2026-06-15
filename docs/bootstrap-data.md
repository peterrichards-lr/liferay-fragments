# Fragment Bootstrap & Showcase Data Guide

To help users understand, test, and preview our high-fidelity data-driven fragments, this repository includes a complete bootstrap data system. This guide explains how this data is structured, how to provision it in your Liferay instance, and how to use it to see each fragment in action.

---

## 💡 Why Use Bootstrap Data?

Advanced Liferay fragments—such as dynamic sliders, charts, tables, and timelines—require underlying data structures (WebContent, Documents, Collections, or Custom Objects) to function. Without this data:

- The fragments will render blank or display loading spinners.
- Users cannot see the rich styling, hover effects, and micro-animations that make these fragments premium.
- Developers cannot easily understand what JSON payload or data fields a fragment expects.

By provisioning the bootstrap data, you can:

1. **Instantly Demo Fragments**: Drag a fragment onto a page, select the seeded collection/object, and see a fully functional, beautiful component.
2. **Learn Schema Expectations**: Use the `test-data.json` manifests as reference architectures to build your own production schemas.
3. **Develop & Debug Off-line**: Run E2E verification suites locally with guaranteed, stable datasets.

---

## 🛠️ How to Provision the Bootstrap Data

The bootstrap data consists of **Web Content Structures, Articles, Documents, Collections**, and **Custom Objects**. You can deploy it using the following methods:

### Method 1: Automated E2E Runner (Recommended)

When you run the automated E2E test runner, it automatically provisions all necessary test and showcase data:

```powershell
# In Windows PowerShell (invokes Git Bash)
& "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p fragments-test-env -k
```

This script will:

1. Spin up the Liferay Docker container.
2. Build and deploy all fragment collections.
3. Call the Liferay Headless Delivery, Headless Admin, and JSON-WS APIs to create structures, documents, articles, and collections.
4. Deploy the Custom Object definitions and sample records via Batch Client Extensions.

### Method 2: Deploying Showcase Data Extensions

If you already have a Liferay workspace or standalone instance running, you can package and deploy the showcase objects and records:

1. **Build Showcase ZIPs**:

   ```bash
   ./create-fragment-zips.sh --showcase
   ```

   This compiles all showcase assets in `other-resources/showcase-data/` into deployable Client Extensions under `zips/showcase/`.

2. **Deploy to Liferay**:
   ```bash
   ./deploy-fragment-zips.sh [PATH_TO_LIFERAY_BUNDLE] --showcase
   ```

---

## 📁 Understanding the Manifests (`test-data.json`)

Each Gemini-generated fragment contains a `test-data.json` manifest that declares the exact assets required for its E2E verification. Here is how they are structured:

```json
{
  "webContentStructures": [
    {
      "externalReferenceCode": "SLIDER-SLIDE-STRUCT-V3",
      "name": "Slider Slide Structure",
      "description": "Structure for slides in the Dynamic Collection Slider",
      "fields": [
        { "name": "title", "type": "text", "label": "Title" },
        { "name": "description", "type": "text", "label": "Description" },
        { "name": "image", "type": "text", "label": "Slide Image" }
      ]
    }
  ],
  "documents": [
    {
      "externalReferenceCode": "SLIDE-IMG-01",
      "title": "gravity_recommendation.png",
      "filePath": "e2e-tests/assets/gravity_recommendation.png"
    }
  ],
  "webContentArticles": [
    {
      "externalReferenceCode": "SLIDE-ARTICLE-01",
      "structureERC": "SLIDER-SLIDE-STRUCT-V3",
      "title": "Slide 1: Recommendation Gravity",
      "contentFields": [
        {
          "name": "title",
          "value": "Gravity Discovered to be a Recommendation, Not a Rule"
        },
        {
          "name": "description",
          "value": "Local engineering team successfully runs code upside-down."
        },
        { "name": "image", "value": "SLIDE-IMG-01" }
      ]
    }
  ],
  "collections": [
    {
      "externalReferenceCode": "SLIDER-E2E-COLL",
      "name": "E2E Slider Collection",
      "description": "Collection for dynamic slider testing",
      "assetType": "journal-article",
      "items": [
        {
          "type": "journal-article",
          "externalReferenceCode": "SLIDE-ARTICLE-01"
        }
      ]
    }
  ],
  "pageConfig": {
    "fragmentConfig": {
      "collectionId": "SLIDER-E2E-COLL",
      "displayStyle": "split",
      "autoplayInterval": "5000"
    }
  }
}
```

### Key Elements:

- **`externalReferenceCode` (ERC)**: Stable identifiers used to map assets. Liferay guarantees ERCs are unique and constant, allowing fragments to bind to them without relying on auto-generated database IDs.
- **`contentFields` / `fields`**: The names and types of fields (e.g., `title`, `description`, `image`). Your custom data models should match these names to ensure compatibility.
- **`pageConfig`**: The exact configuration overrides (collection mappings, interval timers, display styles) used to verify and preview the fragment.

---

## 📋 List of Seeded Data by Fragment

Here are the 9 fragments that leverage the bootstrap data, along with the structures, objects, or collections they interact with:

### 1. Dynamic Collection Slider

- **Target Collection ERC**: `SLIDER-E2E-COLL`
- **Underlying Structure ERC**: `SLIDER-SLIDE-STRUCT-V3`
- **Seeded Articles**: Three slides containing fictional tech news (e.g., Office Coffee machine requiring OAuth2).
- **Seeded Documents**: Mock PNG images (`SLIDE-IMG-01`, `SLIDE-IMG-02`, `SLIDE-IMG-03`).
- **Value**: Renders a premium carousel using Liferay's Headless Delivery Content-Sets API.

### 2. Activity Heatmap

- **Target Object ERC**: `ACTIVITY_LOG`
- **Source Folder**: `other-resources/showcase-data/activity-log`
- **Seeded Records**: Daily activity data mapping dates and activity intensities (e.g., commits, form submissions).
- **Value**: Visualizes user contributions over time in a GitHub-style contribution grid.

### 3. Dynamic Object Gallery

- **Target Object ERC**: `PRODUCT_SHOWCASE`
- **Source Folder**: `other-resources/showcase-data/product-showcase`
- **Seeded Records**: Products with price, rating, category, description, and images.
- **Value**: Renders an interactive, grid-based card gallery with animations and search capabilities.

### 4. Interactive Event Timeline

- **Target Object ERC**: `COMPANY_MILESTONE`
- **Source Folder**: `other-resources/showcase-data/company-milestone`
- **Seeded Records**: Historical milestones with date, title, details, and images.
- **Value**: Renders an elegant vertical timeline that animate on scroll.

### 5. Object-Linked Chart

- **Target Object ERC**: `WATER_READING`
- **Source Folder**: `other-resources/showcase-data/water-readings`
- **Seeded Records**: Daily meter readings with value, date, unit, and status.
- **Value**: Uses Chart.js to render a responsive time-series line chart bound directly to Liferay custom objects.

### 6. Radial KPI Gauge

- **Target Object ERC**: `WATER_READING`
- **Value**: Visualizes single-metric KPIs (e.g., latest water usage vs limit) in a semi-circular dial with micro-animations.

### 7. Meta-Object Table

- **Target Object ERC**: `WATER_READING`
- **Value**: Implements a high-performance data table with client-side sorting, pagination, and status badge formatting.

### 8. Meta-Object Form

- **Target Object ERC**: `WATER_READING`
- **Value**: Automatically discovers fields from the Object Admin definition and generates a themed input form supporting validation and submission.

### 9. Meta-Object Record View

- **Target Object ERC**: `WATER_READING`
- **Value**: Renders details of a single object record in a structured card with metadata tags and actions.

---

## 🚀 How to Demo and Learn in Liferay

Follow these steps to explore how fragments utilize the seeded data:

1. **Sign in to Liferay**: Navigate to `http://localhost:8090` and sign in using `test@liferay.com` / `test`.
2. **Access Page Editor**: Create a new content page under the **Guest** site or edit an existing one.
3. **Drop a Fragment**: Open the fragments sidebar, navigate to the **Gemini Generated** category, and drag-and-drop the **Dynamic Collection Slider** or **Object-Linked Chart** onto the page.
4. **Configure Mappings**:
   - For the **Slider**: Click the fragment, go to the configuration panel, and under the "Data" tab, verify the **Collection** is set to `E2E Slider Collection` (or select it manually).
   - For **Object Fragments**: Set the **Object Definition ERC** to `WATER_READING` (or `COMPANY_MILESTONE`/`PRODUCT_SHOWCASE`) in the configuration panel.
5. **Observe and Inspect**:
   - Notice how the fields (e.g., date formats, status colors, image URLs) bind automatically.
   - Open your browser's Developer Tools (`F12`), check the **Network** tab, and reload. You will see the clean REST API requests (`/o/headless-delivery/v1.0/content-sets/...` or `/o/c/waterreadings/...`) that the fragment makes to fetch its data.
