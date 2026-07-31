# UI Refactor Roadmap

## How To Use
- Check items as they are completed.
- Keep scope tight per task to avoid regressions.
- Run lint after each phase.

## Phase 1: Foundation
- [x] Shell and theme consistency sweep
	- Files: src/app/globals.css, src/app/layout.tsx, src/app/components/NavBar.tsx, src/app/components/NavBarProfile.tsx, src/app/components/Footer.tsx
	- Goal: remove remaining hardcoded colors and keep all styling aligned to FM palette tokens.

- [x] Landing page final polish
	- Files: src/app/page.tsx
	- Goal: finalize spacing, responsive typography, and section rhythm.

## Phase 2: Core Product Pages
- [x] Login and onboarding visuals
	- Files: src/app/login/page.tsx
	- Goal: improve form hierarchy, card styling, and error states.

- [x] Saves page main experience
	- Files: src/app/saves/page.tsx, src/app/saves/SaveCard.tsx
	- Goal: elevate header, filter controls, cards, and empty states.

- [x] Add save flow styling
	- Files: src/app/add-save/page.tsx, src/app/add-save/NewSaveForm.tsx
	- Goal: improve form sections, field grouping, and action buttons.

## Phase 3: Progress and Collection Views
- [x] Challenges page system
	- Files: src/app/challenges/page.tsx, src/app/challenges/ChallengeSection.tsx
	- Goal: unify section containers, status chips, and filter controls.

- [x] Trophies page system
	- Files: src/app/trophies/page.tsx, src/app/trophies/TrophiesHeader.tsx, src/app/trophies/TrophyCountry.tsx
	- Goal: improve data density, visual grouping, and card readability.

## Phase 4: Social, Profile, and Admin
- [ ] Friends and social area
	- Files: src/app/friends/page.tsx, src/app/friends/components/FriendsList.tsx, src/app/friends/components/FriendRequests.tsx, src/app/friends/components/SearchFriends.tsx, src/app/friends/components/FriendsLeaderboard.tsx
	- Goal: refine tabs, panel styles, badges, and interaction states.

- [ ] Profile area refresh
	- Files: src/app/profile/page.tsx, src/app/profile/components/ProfileView.tsx
	- Goal: modernize profile header, stat blocks, and action grouping.

- [ ] Admin area visual consistency
	- Files: src/app/admin/page.tsx
	- Goal: replace placeholder styles with the shared FM design language.

## Phase 5: Shared Components and QA
- [ ] Shared feedback components
	- Files: src/app/components/FootBallLoader.tsx, src/app/components/GradientButton.tsx, src/app/components/modals/ConfirmationModal.tsx
	- Goal: align loader, button, and modal styling with palette and surfaces.

- [ ] Final QA and responsive pass
	- Files: src/app/page.tsx, src/app/saves/page.tsx, src/app/challenges/page.tsx, src/app/trophies/page.tsx, src/app/friends/page.tsx, src/app/login/page.tsx
	- Goal: validate mobile breakpoints, focus/hover states, contrast, and consistency.

