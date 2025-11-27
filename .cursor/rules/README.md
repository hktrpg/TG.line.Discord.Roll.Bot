 HKTRPG Project Rules

This directory contains Cursor Project Rules for the HKTRPG bot development. These rules help maintain code quality, consistency, and best practices across the project.

## Rule Files Overview

### 1. `general.mdc` - General Development Rules
- **Type**: Always Apply
- **Scope**: All files
- **Purpose**: Core principles, code style, file organization, ESLint compliance
- **Key Topics**: Package-first approach, class-first design, clean code, modern JavaScript

### 2. `package-usage.mdc` - Package Usage Guidelines
- **Type**: Apply Intelligently
- **Scope**: When using packages/APIs
- **Purpose**: Prioritize using package functionality over custom code
- **Key Topics**: Discord.js, Mongoose, Math.js, dice-roller patterns

### 3. `nodejs-commonjs.mdc` - Node.js CommonJS Standards
- **Type**: Apply to Specific Files (`**/*.js`, `!**/*.mjs`)
- **Scope**: All JavaScript files (except ES modules)
- **Purpose**: CommonJS module patterns, async/await, error handling
- **Key Topics**: Module structure, environment variables, class definitions

### 4. `modules.mdc` - Modules Directory Rules
- **Type**: Apply to Specific Files (`modules/**/*.js`)
- **Scope**: Core modules directory
- **Purpose**: Standards for core functionality and platform integrations
- **Key Topics**: Database modules, platform integrations, class-based modules

### 5. `roll.mdc` - Roll Directory Rules
- **Type**: Apply to Specific Files (`roll/**/*.js`)
- **Scope**: Dice rolling and TRPG game systems
- **Purpose**: Standards for game system implementations
- **Key Topics**: Dice rolling, game systems, character cards, command handlers

### 6. `views.mdc` - Views Directory Rules
- **Type**: Apply to Specific Files (`views/**/*.{js,html}`)
- **Scope**: Frontend HTML, CSS, JavaScript
- **Purpose**: Standards for frontend development
- **Key Topics**: HTML structure, CSS organization, Socket.io, responsive design

### 7. `test.mdc` - Testing Standards
- **Type**: Apply to Specific Files (`test/**/*.js`, `**/*.test.js`)
- **Scope**: Test files
- **Purpose**: Jest testing patterns and best practices
- **Key Topics**: Mocking, test structure, async testing, coverage

### 8. `architecture.mdc` - Architecture & Design Patterns
- **Type**: Apply Intelligently
- **Scope**: When designing new features
- **Purpose**: Design patterns and architectural principles
- **Key Topics**: Design patterns, architecture layers, error handling, caching

## Rule Application Priority

Rules are applied in this order:
1. **Always Apply** rules (general.mdc)
2. **Apply Intelligently** rules (when relevant)
3. **Apply to Specific Files** rules (based on file path)

## Quick Reference

### Before Writing Code
1. Check `package.json` - Does a package provide this functionality?
2. Check existing code - How is similar functionality implemented?
3. Follow ESLint rules - Run `yarn lint` before committing
4. Use classes for complex logic
5. Write tests for new features

### File Organization
- **Temporary files**: `temp/` directory
- **Documentation**: `MD/` directory
- **Core modules**: `modules/` directory
- **Game systems**: `roll/` directory
- **Frontend**: `views/` directory
- **Tests**: `test/` directory

### Code Style
- **Language**: English for code/comments, Traditional Chinese for user messages
- **Package manager**: Use `yarn`, not `npm`
- **Module system**: CommonJS (`require`/`module.exports`)
- **Classes**: Prefer classes over standalone functions
- **Naming**: kebab-case for files, camelCase for variables/functions

### Key Principles
1. **Package-first**: Use existing packages before writing custom code
2. **Class-first**: Use classes for stateful operations
3. **Sustainable**: Avoid hardcoded values, use design patterns
4. **Clean code**: Single responsibility, DRY, meaningful names
5. **Modern**: Use ES6+ features, async/await, modern patterns

## Updating Rules

When updating rules:
1. Keep rules focused and actionable
2. Provide examples from existing codebase
3. Reference specific files when helpful
4. Update this README if adding new rule files
5. Test rules by using them in actual development

## See Also

- `eslint.config.mjs` - ESLint configuration
- `package.json` - Dependencies and scripts
- `README.md` - Project overview
- `MD/` - Project documentation
