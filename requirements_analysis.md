## Requirements Analysis and Data Mapping

### 1. Data Source: `pasted_content.txt`
This file provides the detailed functional and non-functional requirements for the credit card application management system, including workflow details, feature list, frontend/backend recommendations, simplified database models, tools/libraries, access roles, dashboard metrics, and reporting module specifications.

### 2. Data Source: `CreditcardDistributionandPending-13-07-25.xlsx`
This Excel file provides sample data for credit card applications. The column headers were extracted to understand the data structure.

### 3. Mapping Excel Columns to Database Model Fields
Based on the `Application` model provided in `pasted_content.txt` and the column names from the Excel file, the following direct mappings are identified:

| Excel Column | Database Model Field (`Application` class) |
|--------------|--------------------------------------------|
| `DATE`       | `date`                                     |
| `Br Code`    | `branch_code`                              |
| `App ID`     | `app_id`                                   |
| `Name`       | `name`                                     |
| `Card`       | `card`                                     |
| `Type`       | `type`                                     |
| `Remarks`    | `remarks`                                  |

### 4. Discrepancies and Ambiguities

- **`Assaign` (Excel) and `Work On` (Excel) vs. `assigned_to` (Model):**
  - The Excel file contains both `Assaign` (likely a typo for 'Assign') and `Work On` columns. The `Application` model has an `assigned_to` field (ForeignKey to User).
  - **Assumption:** For now, `Assaign` will be considered the primary source for mapping to `assigned_to`. The purpose of `Work On` is unclear and will be treated as an auxiliary field not directly mapped to the `Application` model unless further clarification is provided.

- **` Status` (Excel) vs. `status` (Model):**
  - The Excel column name ` Status` has a leading space. This needs to be handled during data parsing to correctly map to the `status` field in the model.

- **Unmapped Excel Columns:**
  - `Inform To`
  - `IPT`
  - `Unnamed: 12` through `Unnamed: 23`
  - `Not Editable`
  - **Assumption:** These columns are not directly mapped to the `Application` model based on the provided schema. `Not Editable` might be a flag indicating the record's editability status, which could be incorporated into the application logic if necessary, but not directly as a model field for now. The `Unnamed` columns are likely empty or contain irrelevant data.

### 5. Parser Requirement Clarification
- The `pasted_content.txt` specifies a parser requirement to split raw CMS rows into multiple structured entries. This implies that a single row in the raw CMS data (which the Excel file seems to represent a processed version of) might contain information for multiple cards (MAIN/SUPPLE) and types (VSCC, VSCG, VSCP). The provided Excel file already seems to have split these into individual rows. This needs to be confirmed during the backend development phase when implementing the CMS Raw Data Uploader and Parser.

### 6. Status Management and Audit Trail
- The status management (`UNTOUCH`, `PENDING`, `HOLD`, `DONE`) is clearly defined and will be implemented as choices for the `status` field.
- The audit trail requirement (`who did what and when`) will necessitate tracking changes to application records, likely through a separate logging mechanism or by leveraging Django's built-in features for tracking model changes.

