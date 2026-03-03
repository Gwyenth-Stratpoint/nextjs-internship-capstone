<<<<<<< HEAD
# Next.js Internship Capstone Project

> **ProjectFlow** - A comprehensive 12-week full-stack development internship program focused on building a modern project management tool with Next.js 16, React 19, and TypeScript.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.10.0-yellow?logo=pnpm)](https://pnpm.io/)

## 📚 Repository Structure

```
nextjs-internship-capstone/
├── project/              # Main Next.js application
│   ├── app/             # Next.js 16 App Router
│   ├── components/      # React components
│   ├── lib/             # Utilities and configurations
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # State management (Zustand)
│   ├── types/           # TypeScript definitions
│   └── README.md        # Project documentation
├── docs/                # Program documentation
│   ├── CODE_REVIEW_GUIDE.md
│   ├── DEVELOPMENT_SETUP.md
│   └── TIMELINE_MILESTONES.md
└── tasks/               # Task breakdown and planning
    ├── INDIVIDUAL_DEVELOPMENT_APPROACH.md
    └── tasks-capstone-project-management-tool.md
```

## 🎯 Project Overview

**ProjectFlow** is a Kanban-style project management tool (similar to Trello/Asana) built as an internship capstone project. Each intern builds their own complete implementation from scratch, gaining hands-on experience with modern full-stack development.

### ✨ Key Features (Planned)

- 🔐 **Authentication** - Secure user authentication with Clerk
- 📊 **Project Management** - Create and manage multiple projects
- 📋 **Kanban Boards** - Drag-and-drop task management
- 👥 **Team Collaboration** - Task assignment and real-time updates
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🌓 **Theme Support** - Dark/Light mode toggle

### 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router with Turbopack) |
| **Runtime** | React 19 |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 3.3 |
| **Database** | PostgreSQL + Drizzle ORM _(planned)_ |
| **Auth** | Clerk _(planned)_ |
| **State** | Zustand _(planned)_ |
| **Testing** | Jest, React Testing Library, Playwright _(planned)_ |
| **Deployment** | Vercel _(planned)_ |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ LTS
- **pnpm** 10.10.0+ (`npm install -g pnpm`)
- **Git** for version control
- **VS Code** (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/nextjs-internship-capstone.git
   cd nextjs-internship-capstone
   ```

2. **Navigate to the project directory**
   ```bash
   cd project
   ```

3. **Install dependencies**
=======
# ProjectFlow - Next.js Internship Capstone Project

## 🚀 Project Overview

**ProjectFlow** is a collaborative project management tool built with Next.js 16 App Router, designed as the capstone project for a 12-week full-stack development internship program. This is currently a **mockup/prototype** with placeholder components and incomplete functionality.

### 📋 What We're Building

A modern, Kanban-style project management application similar to Trello or Asana, featuring:

- **Landing Page** with project overview and roadmap ✅ *Implemented*
- **Dashboard Layout** with navigation and theme toggle ✅ *Implemented*
- **Project Management Interface** with placeholder components ✅ *Basic Structure*
- **User Authentication** with Clerk ⏳ *Planned*
- **Interactive Kanban Board** with drag-and-drop ⏳ *Planned*
- **Real-time Collaboration** features ⏳ *Planned*
- **Responsive Design** with Tailwind CSS + custom color scheme ✅ *Implemented*

## 🎯 Learning Objectives

By completing this project, interns will demonstrate proficiency in:

- ✅ **Full-Stack Next.js Development** (App Router, Server Components, Server Actions)
- ✅ **Secure Authentication** (Clerk integration)
- ✅ **Database Design & Management** (PostgreSQL with Drizzle ORM)
- ✅ **State Management** (Zustand for client-side state)
- ✅ **Professional Git Workflow** (GitHub Flow, PR reviews)
- ✅ **Testing Strategy** (Unit, Integration, E2E)
- ✅ **Production Deployment** (Vercel CI/CD)

## 📅 Timeline

- **Duration**: 10-12 weeks
- **Team Size**: Multiple interns
- **Structure**: Individual development with collaborative learning and task tracking

### Phase Breakdown
- **Weeks 1-2**: Project setup, authentication, basic UI
- **Weeks 3-4**: Core CRUD operations (Projects, Lists, Tasks)
- **Weeks 5-6**: Advanced features (Drag & Drop, State Management)
- **Weeks 7-8**: Polish, optimization, advanced collaboration features
- **Weeks 9-10**: Testing, deployment, final polish
- **Weeks 11-12**: Documentation, showcase preparation (if time permits)

## 🛠 Tech Stack

### Currently Implemented
- **Framework**: Next.js 16.1.6 (App Router with Turbopack) ✅
- **Runtime**: React 19 ✅
- **Language**: TypeScript 5.9 ✅
- **Styling**: Tailwind CSS with custom color scheme ✅
- **Icons**: Lucide React ✅
- **Theme System**: Dark/Light mode toggle ✅

### Planned Dependencies (Not Yet Installed)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Form Validation**: Zod
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel

### Development Tools
- **Version Control**: Git + GitHub
- **Package Manager**: pnpm 10.10.0
- **Linting**: ESLint 9 + Next.js config
- **IDE**: VS Code

## 📁 Current Project Structure

```
project/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (placeholder)
│   ├── (dashboard)/       # Dashboard routes (placeholder)
│   ├── dashboard/         # Main dashboard page ✅
│   ├── projects/          # Project pages (placeholder)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page ✅
├── components/             # Reusable UI components ✅
│   ├── modals/            # Modal components (placeholder)
│   ├── dashboard-*.tsx    # Dashboard components ✅
│   ├── kanban-board.tsx   # Kanban board (placeholder)
│   ├── project-*.tsx      # Project components (placeholder)
│   ├── task-*.tsx         # Task components (placeholder)
│   └── theme-*.tsx        # Theme components ✅
├── hooks/                 # Custom React hooks (placeholder)
├── lib/                   # Utilities and configurations
│   ├── db/               # Database schema (placeholder)
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Form validations (placeholder)
├── stores/                # Zustand state stores (placeholder)
├── types/                 # TypeScript type definitions ✅
├── styles/                # Additional styles
└── public/                # Static assets (placeholder images)
```

### 🚧 Implementation Status

- ✅ **Completed**: Landing page, basic dashboard layout, theme system, TypeScript types
- ⏳ **In Progress**: Component placeholders, routing structure
- ❌ **Not Started**: Authentication, database, state management, testing

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 20+ LTS
- **pnpm**: Latest version (`npm install -g pnpm`)
- **Git**: For version control
- **VS Code**: Recommended IDE

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-internship-capstone/project
   ```

2. **Install dependencies**
>>>>>>> d7e646b (feat(auth): implement sign-in and sign-up pages with routing)
   ```bash
   pnpm install
   ```

<<<<<<< HEAD
4. **Start development server**
=======
3. **Start development server**
>>>>>>> d7e646b (feat(auth): implement sign-in and sign-up pages with routing)
   ```bash
   pnpm dev
   ```

<<<<<<< HEAD
5. **Open in browser**
   - Visit [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Project README](project/README.md) | Main application documentation |
| [Development Setup](docs/DEVELOPMENT_SETUP.md) | Setup guide and workflow |
| [Timeline & Milestones](docs/TIMELINE_MILESTONES.md) | 12-week project timeline |
| [Code Review Guide](docs/CODE_REVIEW_GUIDE.md) | Code review standards |
| [Tasks Breakdown](tasks/tasks-capstone-project-management-tool.md) | Detailed task list |

## 📅 12-Week Program Structure

### Phase 1: Foundation (Weeks 1-3)
- Project setup and Next.js fundamentals
- Environment configuration
- Git workflow and best practices

### Phase 2: Implementation (Weeks 4-8)
- Authentication with Clerk
- Database design and implementation
- Core CRUD operations
- Kanban board with drag-and-drop
- State management with Zustand

### Phase 3: Production (Weeks 9-12)
- Comprehensive testing
- Performance optimization
- Production deployment
- Documentation and showcase

## 🎓 Learning Objectives

By completing this capstone, interns will demonstrate:

- ✅ Full-stack Next.js 16 development with App Router
- ✅ Server Components and Server Actions
- ✅ TypeScript for type-safe development
- ✅ PostgreSQL database design with Drizzle ORM
- ✅ Authentication and authorization with Clerk
- ✅ Client-side state management with Zustand
- ✅ Testing strategies (unit, integration, E2E)
- ✅ Git workflow and collaboration
- ✅ Production deployment and CI/CD

## 🌟 Current Status

This is an **active learning project** currently in the setup phase:

- ✅ **Foundation Complete**: Next.js 16 + React 19 upgrade
- ✅ **UI Mockups**: Landing page and dashboard layouts
- ✅ **Type Definitions**: Complete TypeScript types
- ⏳ **In Progress**: Component development
- 📝 **Planned**: Authentication, database, testing

## 🔄 Development Approach

### Individual Development
Each intern builds their own complete version by:
1. **Forking** this repository
2. **Working independently** through all phases
3. **Building** the entire stack from start to finish
4. **Owning** their complete portfolio project

### Collaborative Learning
Despite individual development, interns collaborate through:
- Daily standups sharing progress and blockers
- Code review sessions for learning
- Technical discussions on implementation approaches
- Knowledge sharing and problem-solving

## 🤝 Contributing

This is an internship learning project. Each intern maintains their own fork and develops independently.

## 📄 License

This project is for educational purposes as part of the internship program.

## 🆘 Support & Resources

- **Project Documentation**: See [docs/](docs/) folder
- **Task Breakdown**: See [tasks/](tasks/) folder
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

**Built with ❤️ as part of the Stratpoint Engineering Internship Program**
=======
4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Explore the landing page and dashboard mockup

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### 🚧 Current Limitations
- **No Authentication**: Sign-in/sign-up buttons are placeholders
- **No Database**: All data is mocked/placeholder
- **No State Management**: Zustand stores are placeholder functions
- **No Real Functionality**: Most interactions are visual only



## 👥 Individual Development & Collaboration

### Project Setup
**Each intern should fork this repository individually** to create their own complete implementation:

1. **Fork the Repository**
   ```bash
   # Fork this repo on GitHub to your personal account
   # Clone your fork locally
   git clone https://github.com/YOUR-USERNAME/nextjs-internship-capstone.git
   cd nextjs-internship-capstone/project
   ```

2. **Set Up Your Development Environment**
   ```bash
   # Install dependencies
   pnpm install

   # Start development
   pnpm dev
   ```

3. **Create Your Implementation**
   - Work on your own fork independently
   - Build the complete project from start to finish
   - Own your entire codebase and learning journey

### Why Individual Forks?
- **Complete Learning Experience**: Every intern builds the full stack
- **Portfolio Project**: Each intern owns a complete project for their portfolio
- **Individual Pacing**: Work at your own pace while following milestones
- **Problem-Solving Skills**: Handle all types of challenges independently
- **Flexibility**: Explore different approaches and implementations

### Collaboration & Learning
Despite individual development, interns collaborate through:
- **Daily Standups**: Share progress, blockers, and solutions
- **Code Review Sessions**: Optional peer reviews for learning
- **Technical Discussions**: Share different implementation approaches
- **Knowledge Sharing**: Help each other overcome challenges

## 📋 Task Tracking & Progress Management

### Recommended Task Tracking Methods

#### Option 1: GitHub Issues (Recommended)
Create issues in your forked repository to track your progress:

```markdown
## Task: [Phase] - [Feature Name]
**Priority**: High/Medium/Low
**Estimated Time**: X hours
**Week**: Week X

### Description
Clear description of what needs to be implemented.

### Acceptance Criteria
- [ ] Specific, measurable criteria
- [ ] That define when the task is complete
- [ ] Include testing requirements

### Notes
- Dependencies on other tasks
- Useful resources or documentation links
```

#### Option 2: GitHub Projects Board
Set up a personal project board in your fork:
- **📋 Backlog** - All planned tasks
- **🎯 Current Sprint** - Tasks for this week
- **👨‍💻 In Progress** - Currently working on
- **👀 Review** - Self-review and testing
- **✅ Done** - Completed tasks

#### Option 3: External Tools
- **Notion**: Create a personal project dashboard
- **Trello**: Simple Kanban board for task management
- **Linear**: More advanced project management
- **GitHub Projects**: Built-in project management

### Task Categories & Labels
Organize your tasks with these categories:
- `setup` - Project initialization and configuration
- `auth` - Authentication and user management
- `database` - Database schema and operations
- `frontend` - UI components and pages
- `backend` - API routes and server logic
- `testing` - Unit, integration, and E2E tests
- `deployment` - Production deployment and CI/CD
- `documentation` - README, comments, and guides

### Weekly Milestone Tracking
Track your progress against these milestones:
- **Week 1-2**: Foundation & Setup
- **Week 3-4**: Authentication & Database
- **Week 5-6**: Core CRUD Features
- **Week 7-8**: Advanced Features & UI
- **Week 9-10**: Testing & Deployment
- **Week 11-12**: Polish & Documentation

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication Guide](https://clerk.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com/)

## 🎯 Success Metrics

### Phase 1: Foundation (Current Status)
- [x] Project structure and basic routing
- [x] Landing page with project overview
- [x] Dashboard layout and navigation
- [x] Theme system (dark/light mode)
- [x] TypeScript configuration
- [ ] Authentication system integration
- [ ] Database schema and connection

### Phase 2: Core Features (Upcoming)
- [ ] Project CRUD operations
- [ ] Task management system
- [ ] Kanban board with drag-and-drop
- [ ] User management and permissions

### Phase 3: Advanced Features (Future)
- [ ] Real-time collaboration
- [ ] Advanced filtering and search
- [ ] File attachments and comments
- [ ] Comprehensive test coverage
- [ ] Production deployment

### Final Goals
- [ ] Fully functional project management application
- [ ] Clean, maintainable codebase with proper documentation
- [ ] Professional Git workflow demonstrated
- [ ] Successful deployment to production

## 🔧 Development Notes

### Custom Color Scheme
The project uses a custom Tailwind color palette:
- **Primary**: Blue Munsell (`blue_munsell`)
- **Background**: Platinum, Outer Space (`platinum`, `outer_space`)
- **Accent**: Payne's Gray, French Gray (`payne's_gray`, `french_gray`)

### Component Architecture
- **Layout Components**: Dashboard layout with sidebar navigation
- **UI Components**: Reusable cards, buttons, and theme toggle
- **Page Components**: Landing page and dashboard with placeholder content
- **Placeholder Components**: Kanban board, modals, and forms (not functional)

### Known Issues
- Placeholder authentication routes (non-functional)
- Mock data throughout the application
- Incomplete state management implementation

## 📞 Getting Help

- **Mentor Office Hours**: [Schedule TBD]
- **Team Chat**: [Google Chat workspace]
- **Documentation**: Check component files for TODO comments and implementation notes
- **Issues**: Use GitHub Issues for bug reports and feature requests

## 🔧 Implementing Real Dependencies

As you progress through development, you'll need to replace placeholder dependencies with real ones:

### Steps to Clean Up Dependencies

1. **Remove placeholder dependencies** from `package.json`:
   ```bash
   # Remove the _comment and _todo_dependencies sections
   # These contain placeholder/mock dependencies
   ```

2. **Install real dependencies** as you implement features:
   ```bash
   # Example: When implementing authentication
   pnpm add @clerk/nextjs

   # Example: When implementing database
   pnpm add drizzle-orm drizzle-kit @vercel/postgres

   # Example: When implementing drag & drop
   pnpm add @dnd-kit/core @dnd-kit/sortable

   # Example: When implementing state management
   pnpm add zustand

   # Example: When implementing form validation
   pnpm add zod
   ```

3. **Add development dependencies**:
   ```bash
   # Testing dependencies
   pnpm add -D jest @testing-library/react @testing-library/jest-dom playwright

   # Additional dev tools as needed
   pnpm add -D @types/node
   ```

4. **Check for dependency conflicts**:
   ```bash
   # Check for warnings
   pnpm ls

   # Install missing peer dependencies if needed
   pnpm add <missing-peer-dependency>
   ```

### Implementation Checklist
- [ ] Authentication system with Clerk
- [ ] Database schema and ORM with Drizzle
- [ ] State management with Zustand
- [ ] Drag & drop functionality with @dnd-kit
- [ ] Form validation with Zod
- [ ] Testing setup with Jest and Playwright
- [ ] All placeholder components replaced with real functionality
- [ ] No more TODO comments in package.json

## 🚀 Next Steps for Development

1. **Set up Authentication**: Integrate Clerk for user management
2. **Database Integration**: Implement Drizzle ORM with PostgreSQL
3. **State Management**: Complete Zustand store implementations
4. **Core Features**: Build functional CRUD operations
5. **Testing**: Add comprehensive test suite
6. **Deployment**: Set up CI/CD pipeline with Vercel

---

**Let's build something amazing together! 🎉**

*This is a learning project - expect placeholder content and incomplete features as development progresses.*
>>>>>>> d7e646b (feat(auth): implement sign-in and sign-up pages with routing)
