# Contributing Guidelines

Thank you for your interest in the SealBid project! We welcome contributions in all forms.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an Issue and include the following information:

- Detailed bug description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment information (OS, browser, Sui version, etc.)
- Screenshots (if applicable)

### Suggesting New Features

We welcome new feature suggestions! Please create an Issue describing:

- Purpose and use case of the feature
- Expected behavior
- Possible implementation approaches
- Whether you're willing to implement it yourself

### Submitting Code

1. **Fork the Project**

```bash
# Click the Fork button on GitHub
# Clone your fork
git clone https://github.com/your-username/SealBid.git
cd SealBid
```

2. **Create a Branch**

```bash
# Create feature branch
git checkout -b feature/feature-name

# Or bug fix branch
git checkout -b fix/issue-number
```

3. **Write Code**

- Follow project coding style
- Add necessary comments
- Write or update tests
- Update relevant documentation

4. **Testing**

```bash
# Test Move contracts
cd move
sui move test

# Test frontend
cd frontend
npm run lint
npm run build
```

5. **Commit**

```bash
git add .
git commit -m "Describe your changes"
git push origin feature/feature-name
```

6. **Create Pull Request**

- Create PR on GitHub
- Fill out PR template
- Wait for review

## 📝 Code Standards

### Move Code Standards

```move
// 1. Module comments
/// Module description

// 2. Use uppercase for constants
const EErrorCode: u64 = 1;

// 3. Function comments
/// Function purpose description
/// Parameter descriptions
/// Return value descriptions

// 4. Use meaningful variable names
let total_supply = 1000000;  // ✅
let ts = 1000000;            // ❌

// 5. Error handling
assert!(condition, EErrorCode);
```

### TypeScript Code Standards

```typescript
// 1. Use TypeScript types
interface User {
  address: string
  balance: number
}

// 2. Use meaningful function names
function formatTokenAmount(amount: string): string  // ✅
function fmt(a: string): string                    // ❌

// 3. Use const and let, avoid var
const packageId = '0x...'  // ✅
var pkgId = '0x...'        // ❌

// 4. Use PascalCase for components
export default function AuctionCard() {}  // ✅
export default function auction_card() {} // ❌

// 5. Use arrow functions
const handleClick = () => {}  // ✅
```

### Git Commit Message Standards

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation update
- `style`: code formatting (doesn't affect code execution)
- `refactor`: refactoring
- `test`: test-related
- `chore`: build process or auxiliary tool changes

Example:
```
feat(auction): add random selection strategy

Implement RANDOM_N strategy for fair token distribution.
The strategy uses blockchain timestamp as seed for randomness.

Closes #123
```

## 🧪 Testing Guide

### Move Contract Tests

```bash
cd move

# Run all tests
sui move test

# Run specific tests
sui move test --filter auction_tests

# Show detailed output
sui move test -v
```

### Frontend Tests

```bash
cd frontend

# Lint check
npm run lint

# Type check
npm run type-check

# Build test
npm run build
```

## 📚 Documentation Guide

- All new features should update documentation
- Use clear English descriptions
- Provide code examples
- Update relevant sections in README.md

## 🔍 Code Review Process

1. Automated checks pass
2. At least one maintainer review
3. Address all comments
4. Tests pass
5. Merge to main branch

## ❓ Need Help?

- Check [README.md](README.md)
- Check [documentation](docs/)
- Ask questions in Issues
- Join discussions

## 📜 Code of Conduct

- Respect all contributors
- Be friendly and professional
- Accept constructive criticism
- Focus on what's best for the project

## 🎯 Priorities

Current high-priority tasks:

1. [ ] Improve Seal SDK integration
2. [ ] Add more test cases
3. [ ] Optimize Gas usage
4. [ ] Improve UI/UX
5. [ ] Add more auction strategies

## 🏆 Contributors

Thank you to all contributors!

---

Thanks again for your contribution! 🎉

