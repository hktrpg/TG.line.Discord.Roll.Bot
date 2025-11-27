# HKTRPG Project Rules

This directory contains Cursor Project Rules for the HKTRPG bot development. These rules are optimized for **solo developer** scenarios with **hundreds of thousands of users**, prioritizing **stability and practicality** over perfect architecture.

## Development Context

- **Solo Developer**: One person maintaining the codebase
- **Large User Base**: Hundreds of thousands of users depend on stability
- **Production Environment**: 4GB RAM, 2 vCPUs, 128GB NVMe (Low-resource)
- **Priority**: Stability > Features > Perfect Code
- **Philosophy**: "If it works, don't fix it" - Practical over perfect

## Rule Files Overview

### 1. `general.mdc` - General Development Rules
- **Type**: Always Apply
- **Scope**: All files
- **Purpose**: Core principles, code style, file organization, ESLint compliance
- **Key Topics**: Package-first approach, stability-first, pragmatic development, clean code

### 2. `pragmatic.mdc` - Pragmatic Development Principles
- **Type**: Always Apply
- **Scope**: All development decisions
- **Purpose**: Solo developer best practices, stability priority, fast iteration
- **Key Topics**: Stability first, practical over perfect, quick decision making

### 3. `package-usage.mdc` - Package Usage Guidelines
- **Type**: Apply Intelligently
- **Scope**: When using packages/APIs
- **Purpose**: Prioritize using package functionality over custom code
- **Key Topics**: Discord.js, Mongoose, Math.js, dice-roller patterns

### 4. `nodejs-commonjs.mdc` - Node.js CommonJS Standards
- **Type**: Apply to Specific Files (`**/*.js`, `!**/*.mjs`)
- **Scope**: All JavaScript files (except ES modules)
- **Purpose**: CommonJS module patterns, async/await, error handling
- **Key Topics**: Module structure, environment variables, class definitions

### 5. `modules.mdc` - Modules Directory Rules
- **Type**: Apply to Specific Files (`modules/**/*.js`)
- **Scope**: Core modules directory
- **Purpose**: Standards for core functionality and platform integrations
- **Key Topics**: Database modules, platform integrations, class-based modules

### 6. `roll.mdc` - Roll Directory Rules
- **Type**: Apply to Specific Files (`roll/**/*.js`)
- **Scope**: Dice rolling and TRPG game systems
- **Purpose**: Standards for game system implementations
- **Key Topics**: Dice rolling, game systems, character cards, command handlers

### 7. `views.mdc` - Views Directory Rules
- **Type**: Apply to Specific Files (`views/**/*.{js,html}`)
- **Scope**: Frontend HTML, CSS, JavaScript
- **Purpose**: Standards for frontend development
- **Key Topics**: HTML structure, CSS organization, Socket.io, responsive design

### 8. `test.mdc` - Testing Standards (Pragmatic)
- **Type**: Apply to Specific Files (`test/**/*.js`, `**/*.test.js`)
- **Scope**: Test files
- **Purpose**: Pragmatic testing approach for solo developer
- **Key Topics**: Test priority, critical functionality, skip stable code, fast testing

### 9. `architecture.mdc` - Architecture & Design Patterns (Simplified)
- **Type**: Apply Intelligently
- **Scope**: When designing new features
- **Purpose**: Practical design patterns for solo developer
- **Key Topics**: Manager pattern, module pattern, avoid over-engineering, stability first

### 10. `database-security.mdc` - Database & Security Rules
- **Type**: Apply to Specific Files (`modules/db-connector.js`, `modules/records.js`, `modules/schema.js`, `modules/config/**/*.js`, `utils/security.js`)
- **Scope**: Database operations, security, resource management
- **Purpose**: Database best practices and security for low-resource production environment
- **Key Topics**: Connection pooling, query optimization, input validation, memory management, CSP, rate limiting

## Rule Application Priority

Rules are applied in this order:
1. **Always Apply** rules (`general.mdc`, `pragmatic.mdc`)
2. **Apply Intelligently** rules (when relevant)
3. **Apply to Specific Files** rules (based on file path)

## Quick Reference

### Before Writing Code
1. **Stability check** - Is this modifying stable, working code? Only modify if necessary
2. **Resource check** - Will this work within 4GB RAM and 2 vCPUs?
3. Check `package.json` - Does a package provide this functionality?
4. Check existing code - How is similar functionality implemented?
5. Follow ESLint rules - Run `yarn lint` before committing
6. Use classes for complex logic
7. Write tests for critical/new features (skip stable code)

### Database & Security
- **Use shared connection** - Never create new MongoDB connections
- **Validate all inputs** - Use `InputValidator` from `records.js`
- **Use indexes** - Always index frequently queried fields
- **Limit results** - Use `.limit()` and pagination
- **Cache wisely** - Small, frequently accessed data only
- **Monitor memory** - Keep under 3GB heap usage

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

### Key Principles (Solo Developer Focus)
1. **Stability first**: If it works, don't fix it - Only modify when necessary
2. **Resource-aware**: Optimize for 4GB RAM, 2 vCPUs - Memory efficiency critical
3. **Security-first**: Always validate inputs, use parameterized queries
4. **Practical over perfect**: Simple, working code is better than perfect architecture
5. **Package-first**: Use existing packages before writing custom code
6. **Class-first**: Use classes for stateful operations
7. **Fast iteration**: Get it working, improve later based on feedback
8. **Test what matters**: Critical functionality > New features > Edge cases
9. **Maintainable**: Write code you can understand and fix later

## Solo Developer Guidelines

### Core Mantras
- **If it works, don't fix it** - Stable code serving users is valuable
- **Simple over complex** - Choose the simpler solution
- **Practical over perfect** - Good enough is good enough
- **Users over code** - Prioritize user value over code perfection
- **Fast iteration** - Ship features, improve later

### Decision Making
When faced with a choice:
1. What's simplest?
2. What works?
3. What's maintainable?
4. What helps users?

### Code Modification Rules
✅ **DO modify when:**
- Fixing a bug
- Adding a new feature
- Fixing a real problem

❌ **DON'T modify when:**
- Code works and serves users well
- "It could be better"
- "It's not perfect"

## Updating Rules

When updating rules:
1. Keep rules focused and actionable
2. Provide examples from existing codebase
3. Reference specific files when helpful
4. Update this README if adding new rule files
5. Test rules by using them in actual development
6. **Remember**: Rules should help, not hinder - adjust for practicality

## See Also

- `eslint.config.mjs` - ESLint configuration
- `package.json` - Dependencies and scripts
- `README.md` - Project overview
- `MD/` - Project documentation
