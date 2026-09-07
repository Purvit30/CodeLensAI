# CodeLens AI

> A beginner-focused web application that helps users read, understand, and explore code.

[Live Demo](https://code-lens-ai-seven.vercel.app/login.html) · [Report a Bug](../../issues) · [Request a Feature](../../issues)

<img width="3164" height="1890" alt="image" src="https://github.com/user-attachments/assets/023f2dbe-49c2-48a9-86b1-fafdede53077" />


## Why CodeLens AI?

Code can feel intimidating when you are just starting out. CodeLens AI is designed to make it more approachable: paste code into the editor and receive a structured explanation of what it does, the concepts it uses, a simple flow, and possible improvements.

## Features

- **Code explanation** — explains pasted code in clear, structured sections.
- **Language detection** — detects common patterns for Python, JavaScript, TypeScript, Java, C, C++, Go, Ruby, and PHP.
- **Beginner and advanced modes** — choose a simpler explanation or more technical detail.
- **Code-structure analysis** — identifies variables, functions/classes, loops, and conditions.
- **Flow view** — turns the detected structure into a simple text flow.
- **Basic suggestions** — highlights common improvement opportunities and provides a rough complexity estimate.
- **AI-assisted explanations** — can use an OpenAI API for richer explanations when configured.
- **Browser-side execution logic** — includes execution support for JavaScript, TypeScript, Python, and Ruby.
- **User workspace** — supports sign-up, sign-in, guest access, logout, and issue reporting.
- **Admin prototype** — allows a prototype admin to view users, reports, and audit information.

<img width="3164" height="1890" alt="image" src="https://github.com/user-attachments/assets/bb688bf2-98f6-4bc6-9c45-947c16c0243c" />


## Built With

- **HTML** — page structure and forms
- **CSS** — styling, layout, and responsive UI
- **Vanilla JavaScript** — interface behaviour and code-analysis logic
- **Regular expressions** — simple language and code-structure detection
- **OpenAI API** — optional AI-generated explanations
- **TypeScript compiler**, **Skulpt**, and **Opal** — browser-side support for TypeScript, Python, and Ruby
- **Web Storage API** — prototype local user, report, and audit storage
- **Vercel** — deployment

## How It Works

1. A user pastes code into the editor and selects a language or uses auto-detection.
2. The app looks for familiar code patterns, such as functions, variables, loops, and conditions.
3. It creates a local explanation, key concepts, suggestions, a rough complexity estimate, and a text flow.
4. When an API key is configured, the user can receive an AI-generated explanation instead.
5. The project also includes browser-side execution support for selected languages.

## Browser-side Execution Support

| Language | Runs in the browser? |
| --- | --- |
| JavaScript | Yes |
| TypeScript | Yes, after browser-side transpilation |
| Python | Yes, using Skulpt |
| Ruby | Yes, using Opal |
| Java, C, C++, Go, PHP | Detection only; a runner is not implemented yet |

## Run Locally

```bash
git clone https://github.com/Purvit30/CodeLensAI.git
cd CodeLensAI
```

Open `login.html` in a browser. For local development, use a local server such as VS Code Live Server.

> **Security note:** Never commit API keys, passwords, or other secrets. Keep them outside the repository and handle them on a backend in a production application.

## Project Structure

```text
CodeLensAI/
├── login.html / login.js       # Sign-up and sign-in screens
├── index.html / app.js         # Main editor, analysis, and runner logic
├── auth.js                     # Prototype local authentication helpers
├── admin.html / admin.js       # Prototype admin dashboard
├── admin-login.html / .js      # Admin sign-in interface
├── styles.css                  # Shared styles
└── logo.svg                    # Project logo
```

## Current Scope

CodeLens AI is a learning prototype. Its user data is stored in the browser and its basic code analysis uses practical pattern matching, so it is not a replacement for a compiler, code-review system, or production authentication service.

## Future Improvements

- Move authentication, data, and API-key handling to a secure backend
- Use a database for accounts, reports, and history
- Add a proper OAuth implementation
- Improve language parsing using language-aware tools
- Add tests for detection and analysis behaviour
- Add more code runners safely through server-side sandboxing
- Make explanations more customizable and accessible

## Author

Built by [Purvit Shah](https://github.com/Purvit30).

## License

This project is currently for learning and portfolio purposes. Add a license before reusing it publicly.
