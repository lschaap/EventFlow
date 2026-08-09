# EventFlow

EventFlow is a portfolio MVP for managing school and athletics events from one source of truth.

## Goal

Demonstrate end-to-end implementation skills relevant to AI Software Implementation Manager, Professional Services, and Technical Implementation roles.

The MVP focuses on:
- Requirements-driven solution design
- React + TypeScript
- Firebase Authentication
- Firestore
- Google Calendar integration
- Multi-user event operations
- UAT and go-live documentation

AI features are intentionally deferred until the core workflow is reliable.

## MVP

Users can:
- Sign in
- Create, edit, confirm, complete, and cancel events
- Assign staff
- Assign multiple drivers and vehicles
- Add and remove students
- View upcoming, current, and past events
- Create/update/delete Google Calendar events based on event status

## Repository

```text
EventFlow/
├── README.md
├── docs/
├── frontend/
├── firebase/
├── .gitignore
└── LICENSE
```

## Recommended build order

1. Run the frontend shell
2. Connect Firebase
3. Add authentication
4. Implement Event CRUD
5. Implement participants
6. Implement staff and driver assignments
7. Add Google Calendar sync
8. Run UAT
9. Deploy
10. Add AI enhancements only after MVP validation

## Quick start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The placeholder UI will run before Firebase is configured.

## Documentation

Start with:
- `docs/01-project-charter.md`
- `docs/02-requirements.md`
- `docs/03-data-model.md`
- `docs/07-uat-test-cases.md`

## Portfolio note

Use fictional or anonymized student data in screenshots, demos, and test fixtures.
