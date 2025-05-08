# EarTune - Train Your Musical Ear 🎵

EarTune is an interactive web application designed to help musicians develop their ear training skills through note identification exercises.

## Features

- **User Authentication**: Register and login system with JWT token authentication
- **Note Identification Game**: Train your ear to recognize different musical notes
- **Three-Attempt System**: Each challenge gives players up to three attempts to identify the correct note
- **Score Tracking**: Keep track of your progress and scores
- **Game History**: Review your past game sessions to see improvement over time

## Technology Stack

### Backend
- Django 5.1.x
- Django REST Framework
- Simple JWT for authentication
- SQLite database (development)

### Frontend
- React 19
- React Router 7
- Vite
- Axios for API calls

## Directory Structure

```
Ear_Tune/
├── accounts/             # Django app for user authentication
├── api/                  # Django app for REST API endpoints
├── ear_tune/             # Main Django application
├── frontend/             # React frontend application
│   ├── public/
│   ├── src/
│   ├── selenium_tests/   # Frontend Selenium tests
│   └── ...
├── ll_project/           # Django project configuration
├── functional_tests/     # Backend Selenium tests
├── test_utils/           # Shared test utilities
├── static/               # Static files (including audio)
│   └── audio/
│       └── notes/        # Audio files for musical notes
└── ll_env/               # Python virtual environment
```

## Setup Instructions

### Backend Setup

1. Create and activate the virtual environment:
   ```bash
   python -m venv ll_env
   source ll_env/bin/activate  # On Linux/Mac
   ll_env\Scripts\activate     # On Windows
   ```

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Load fixture data:
   ```bash
   python manage.py loaddata ear_tune/fixtures/games.json
   python manage.py loaddata ear_tune/fixtures/challenges.json
   ```

5. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The React app will be available at: http://localhost:3000

## Testing with Selenium

The project includes directories set up for Selenium testing:

- `functional_tests/` - For Django/backend tests
- `frontend/selenium_tests/` - For React/frontend tests
- `test_utils/` - For shared testing utilities

### Running Selenium Tests

1. Install Selenium and WebDriver:
   ```bash
   pip install selenium pytest-selenium
   
   # For frontend
   cd frontend
   npm install --save-dev selenium webdriver selenium-webdriver
   ```

2. Download appropriate WebDriver for your browser
3. Run the tests (instructions to be added)

## Git Workflow

We use feature branches for development and testing:

1. Create a new branch for features or tests:
   ```bash
   git checkout -b feature/feature-name
   # or
   git checkout -b test/test-name
   ```

2. Commit changes with descriptive messages
3. Push to the remote repository
4. Create a pull request for code review

## Contributors

[Cesar Villarreal]
