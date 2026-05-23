# UML Diagrams for Gestion Charite

This file contains detailed UML diagrams (Mermaid) representing Use Cases, Class model, Activity flows, and Sequence diagrams for the Gestion Charite project. The diagrams include include/extend relationships and important fields, operations, and interactions.

---

## 1) Use Case Diagram

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'actorBackground':'#f3f4f6' }}}%%
usecaseDiagram
  actor User as U
  actor Organizer as O
  actor Admin as A
  rectangle Frontend {
    U -- (Browse Actions)
    U -- (View Action Details)
    U -- (Donate)
    U -- (Participate)
    U -- (Sign Up / Sign In)

    O -- (Create Organization)
    O -- (Manage Organization) <<include>> (Edit Organization)
    O -- (Manage Actions) <<include>> (Create/Edit Action)

    A -- (Approve Organizations)
    A -- (Manage Platform)
  }

  (Donate) ..> (Create Payment) : <<include>>
  (Create Payment) ..> (Confirm Payment) : <<extend>>

  note right of (Manage Actions)
    Manage Actions includes: Create Action, Edit Action, Archive Action, View Metrics
  end note

  note left of (Sign Up / Sign In)
    Supports: Local login, Google OAuth
  end note
```

---

## 2) Class Diagram (simplified, with key attributes and operations)

```mermaid
classDiagram
  class User {
    +Long id
    +String fullName
    +String email
    +String passwordHash
    +String phone
    +String preferredLanguage
    +Long joinedOrganizationId
    +joinOrganization(orgId: Long): User
    +updateProfile(updated: User): User
  }

  class Organization {
    +Long id
    +String name
    +String legalAddress
    +String taxIdentificationNumber
    +String primaryContactName
    +String primaryContactEmail
    +String primaryContactPhone
    +String logoUrl
    +String description
    +String mission
    +Long adminUserId
    +OrganizationStatus status
    +approve(superAdmin: boolean)
  }

  class CharityAction {
    +Long id
    +String title
    +String description
    +BigDecimal targetAmount
    +BigDecimal collectedAmount
    +ActionStatus status
    +Long organizationId
    +String organizationName
    +String categoryName
    +LocalDate startDate
    +LocalDate endDate
    +String location
    +String mediaUrls
    +create(action: CharityAction): CharityAction
    +update(actionId: Long, updated: CharityAction): CharityAction
  }

  class Donation {
    +Long id
    +String donorName
    +String donorEmail
    +BigDecimal amount
    +DonationStatus status
    +Long actionId
    +Long donorUserId
    +PaymentMethod paymentMethod
    +String transactionId
    +createdAt: LocalDateTime
  }

  class Participation {
    +Long id
    +String participantName
    +Long participantUserId
    +Long actionId
    +String actionTitle
    +String roleInAction
    +LocalDateTime joinedAt
  }

  %% Relationships
  User --> Organization : joinedOrganizationId
  Organization "1" o-- "*" CharityAction : provides
  CharityAction "1" o-- "*" Donation : receives
  CharityAction "1" o-- "*" Participation : has
  User "1" o-- "*" Donation : gives
  User "1" o-- "*" Participation : participates

  %% Repositories/Services (not full classes, documented as notes)
  note for CharityAction "CharityActionController: create, update, findAll, findById, archive"
  end note

  note for Organization "OrganizationController: findAll, findById, create, update, approve"
  end note

```

---

## 3) Activity Diagram: Organization Edit Flow (including include/extend details)

```mermaid
flowchart TD
  Start([Start]) --> LoadOrg[Load organization list (/api/organizations)]
  LoadOrg --> Found{Organization linked to user?}
  Found -- No --> ShowNoOrg[Show "No organization" message]
  Found -- Yes --> SetOrg[Set organization state]
  SetOrg --> LoadActions[Load actions (/api/charity-actions?organizationId={id})]
  LoadActions --> Idle[Idle]

  Idle --> ClickEditOrg[User clicks Edit Organization]
  ClickEditOrg --> PrefillLocal[Prefill form from state immediately]
  PrefillLocal --> AsyncHydrate[Async fetch /api/organizations/{id}]
  AsyncHydrate --> Hydrated{Detailed payload received?}
  Hydrated -- Yes --> ReplaceForm[Replace form values with fresh data]
  Hydrated -- No --> KeepLocal[Keep local prefill]
  ReplaceForm --> UserEdits[User edits fields]
  KeepLocal --> UserEdits

  UserEdits --> Submit[Submit form -> PUT /api/organizations/{id}]
  Submit --> SaveOk{200 OK?}
  SaveOk -- Yes --> Refresh[Refresh organization and actions]
  SaveOk -- No --> ShowError[Show error]
  Refresh --> End([End])

  %% include/extend
  UserEdits -->|includes| Validate[Validate required fields]
  Validate -->|extends on error| ShowValidationErrors[Show validation errors]
```

---

## 4) Sequence Diagram: Donation (Stripe) flow (detailed)

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant FE as Frontend
  participant BE as Backend
  participant Stripe
  participant DB as MongoDB

  U->>FE: Click Donate (amount, actionId)
  FE->>BE: POST /payments/stripe/create-checkout-session {actionId, donorUserId, amount, message}
  BE->>Stripe: POST /v1/checkout/sessions (with metadata: actionId, donorUserId, amount, message)
  Stripe-->>BE: 200 {sessionId, checkoutUrl}
  BE-->>FE: 200 {sessionId, checkoutUrl}
  FE-->>U: Redirect to Stripe checkout URL
  U->>Stripe: Complete payment (card)
  Stripe-->>FE: Redirect to FE with session_id
  FE->>BE: POST /payments/stripe/confirm-session?sessionId={id}
  BE->>Stripe: GET /v1/checkout/sessions/{id}
  Stripe-->>BE: 200 {payment_status=paid, metadata}
  BE->>DB: createConfirmedDonation(actionId, donorUserId, amount, message, STRIPE, transactionId)
  DB-->>BE: saved donation
  BE-->>FE: 200 {donation}
  FE-->>U: Show success
```

---

## 5) Sequence Diagram: Organization Dashboard Edit (detailed)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as OrganizationDashboard (React)
  participant API as Backend

  U->>FE: Open dashboard
  FE->>API: GET /organizations
  API-->>FE: [org list]
  FE->>API: GET /organizations/{id}  // hydrate details
  API-->>FE: organization detail
  FE->>API: GET /charity-actions?organizationId={id}
  API-->>FE: [actions]

  U->>FE: Click "Edit" on action card
  FE->>FE: Prefill action form from current card (instant)
  FE->>API: GET /charity-actions/{id}
  API-->>FE: action detail (full)
  FE-->>FE: Hydrate form with detail
  U->>FE: Submit action form (PUT /charity-actions/{id})
  FE->>API: PUT /charity-actions/{id}
  API-->>FE: updated action
  FE->>FE: Update local actions list
```

---

## Notes and Coverage

- The diagrams include both include and extend relationships where appropriate (e.g., payment creation includes confirm step; form validation extends with error display).
- Class diagram lists the most relevant fields present in the backend entities. For brevity some service/internal helper methods are omitted; controllers and services are annotated in notes where they mediate behavior.
- If you want these diagrams exported as SVG/PNG, I can generate them and add to the repo (requires access to a mermaid renderer). Otherwise, they render directly in VS Code with Mermaid preview extensions.

---

End of UML documentation.
