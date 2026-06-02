# domain_specific

## Setup

1. Backend

	- Copy `backend/.env.example` to `backend/.env` and fill in your secrets (do not commit `backend/.env`).

	```powershell
	cd backend
	copy .env.example .env
	# edit .env in your editor and fill GROQ_API_KEY, CHROMA_API_KEY, etc.
	```

2. Frontend

	- Copy `frontend/.env.example` to `frontend/.env` (set `VITE_API_BASE` if your backend runs on a non-default host).

	```powershell
	cd frontend
	copy .env.example .env
	npm ci
	npm run dev
	```

3. Linting (frontend)

	```powershell
	cd frontend
	npm run lint
	```

Security note: I backed up the existing `backend/.env` to `backend/.env.backup` and replaced secrets in `backend/.env` with placeholders to avoid committing sensitive keys. Remove `backend/.env.backup` when it's safe to do so.

