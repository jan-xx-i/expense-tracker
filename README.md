# Expense Tracker - Vanilla HTML/CSS/JavaScript + Spring Boot + MySQL



## Run

### Backend
1. Create MySQL database: `CREATE DATABASE expense_tracker;`
2. Check `backend/src/main/resources/application.properties` and set DB username/password if needed.
3. Open Command Prompt in `backend`.
4. Run `mvn clean install`.
5. Run `mvn spring-boot:run`.
6. Backend runs on `http://localhost:8080`.

### Frontend
Use VS Code Live Server (recommended) on the `frontend/index.html` file.
Open the generated URL, normally `http://localhost:5500/frontend/index.html` or the URL shown by Live Server.

The frontend calls `http://localhost:8080/api` and uses hash routes (`#/login`, `#/register`, `#/`, `#/expenses`, `#/income`) so it works with a simple static server.


