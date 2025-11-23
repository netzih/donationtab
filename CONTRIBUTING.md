# Contributing to DonationTab

Thank you for your interest in contributing to DonationTab! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, professional, and inclusive. We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, device, versions)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write/update tests if applicable
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Guidelines

### Code Style

- Follow existing code patterns
- Use TypeScript for React Native code
- Use ESLint and Prettier (configs provided)
- Write meaningful variable/function names
- Add comments for complex logic

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Example: `feat: add custom amount validation`

### Testing

- Test on both tablet and phone screen sizes
- Test with physical Stripe Terminal if possible
- Test email sending
- Test admin panel functionality

### Documentation

- Update README.md if needed
- Add JSDoc comments for functions
- Update SETUP.md for new configuration steps

## Project Structure

```
donationtab/
├── src/              # React Native app
├── backend/          # Node.js backend
├── docs/             # Additional documentation
└── tests/            # Test files
```

## Development Setup

See SETUP.md for detailed instructions.

## Questions?

Open an issue or contact the maintainers.

Thank you for contributing!
