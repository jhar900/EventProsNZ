# Event Pros NZ - QA Directory

This directory contains all quality assurance artifacts for the Event Pros NZ project.

## Directory Structure

```
docs/qa/
├── gates/           # Quality gate decisions (YAML format)
├── assessments/     # Detailed QA analysis files
├── test-data/       # Mock data and test fixtures
└── README.md        # This file
```

## Quality Gates

Quality gates are stored in `gates/` and follow the naming convention:
- `{epic}.{story}-{slug}.yml`

Example: `1.1-user-authentication-login.yml`

## Assessments

QA assessments are stored in `assessments/` and include:
- **Test Design**: `{epic}.{story}-test-design-{timestamp}.md`
- **Trace Requirements**: `{epic}.{story}-trace-{timestamp}.md`
- **Risk Profile**: `{epic}.{story}-risk-{timestamp}.md`
- **NFR Assessment**: `{epic}.{story}-nfr-{timestamp}.md`

## Test Data

Mock data and test fixtures are stored in `test-data/` for:
- Sample users (event managers, contractors, admins)
- Sample events and job postings
- Test contractor profiles and portfolios
- Mock API responses

## Usage

The QA agent (@qa) will automatically use this directory structure when:
- Running risk assessments (`*risk`)
- Creating test designs (`*design`)
- Generating quality gates (`*gate`)
- Performing comprehensive reviews (`*review`)

## Project Context

- **Project Type**: Greenfield with UI/UX
- **Tech Stack**: Next.js 14 + Supabase + TypeScript
- **Testing**: Jest + Testing Library + Playwright
- **Quality Focus**: Performance, accessibility, user experience
