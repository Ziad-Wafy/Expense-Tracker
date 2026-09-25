# ExpensesTrackerItiGp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

Create a Groq API key, copy `.env.example` to `.env`, and add the key to `GROQ_API_KEY`:

```bash
cp .env.example .env
```

Set `GROQ_API_KEY` in `.env`, then start the app and its private local API together:

```bash
npm start
```

Open `http://localhost:4200/`. The chat uses Groq's `openai/gpt-oss-20b` model through a local server; the key is never sent to the browser. Do not commit `.env`. If the API key is missing or invalid, the chat shows an error instead of a fake response.

If you prefer to run `ng serve --open`, start the chatbot API in a second terminal from this project folder with `npm run api` and keep that terminal running. The `.env` file must be present before starting the API. The UI reports separately when the API is stopped or the Groq key is missing.

Expenses are stored in the browser, so adding, editing, and deleting expenses continues to work without a separate database and data remains available after reloads or the device returning from sleep mode.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
