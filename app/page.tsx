import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Users, Kanban } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const productHighlights = [
  {
    title: "Workspace and Authentication",
    description: "Clerk powers secure sign-in, organizations, and member invitations.",
    state: "Live now",
  },
  {
    title: "Project and Kanban Flow",
    description: "Projects, lists, tasks, drag-and-drop workflows, and audit logging are active.",
    state: "Live now",
  },
  {
    title: "Team and Permissions",
    description: "Workspace membership and project-level access can be managed separately.",
    state: "Live now",
  },
  {
    title: "Analytics and Activity",
    description: "Scoped analytics, comments, and project history update automatically in-app.",
    state: "Live now",
  },
];

export default function HomePage() {
  return (
    <div className="glass-page relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_#f8f3ff_0%,_#f4f6ff_46%,_#eef4ff_100%)]" />
        <div className="absolute left-[-10rem] top-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[#bba7ff]/42 blur-[130px]" />
        <div className="absolute left-[34%] top-[-8rem] h-[20rem] w-[24rem] rounded-full bg-[#ffc4dc]/32 blur-[130px]" />
        <div className="absolute right-[-8rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full bg-[#ffd7a8]/36 blur-[130px]" />
        <div className="absolute bottom-[6%] left-[16%] h-[18rem] w-[20rem] rounded-full bg-[#c8e7ff]/28 blur-[130px]" />
      </div>

      <header className="relative z-10 border-b border-white/50 bg-white/76 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="text-2xl font-bold text-primary">Kilos</div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/dashboard" className="text-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link href="/projects" className="text-foreground hover:text-primary">
                Projects
              </Link>
              <Link href="/sign-in" className="text-foreground hover:text-primary">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-2xl bg-primary px-4 py-2 text-white shadow-[0_12px_24px_rgba(124,131,255,0.22)] transition hover:bg-primary/90"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
            Manage Projects with
            <span className="text-primary"> Kanban Boards</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Organize tasks, collaborate with teams, and track progress with our intuitive
            drag-and-drop project management platform.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-[0_16px_30px_rgba(124,131,255,0.24)] transition hover:bg-primary/90"
            >
              Start Managing Projects
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              href="/projects"
              className="glass-card inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-semibold text-primary transition hover:bg-white/85"
            >
              View Projects
            </Link>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
            <div className="glass-card flex items-center justify-center space-x-2 rounded-3xl px-6 py-5 text-foreground">
              <Kanban className="text-primary" size={20} />
              <span>Drag & Drop Boards</span>
            </div>
            <div className="glass-card flex items-center justify-center space-x-2 rounded-3xl px-6 py-5 text-foreground">
              <Users className="text-primary" size={20} />
              <span>Team Collaboration</span>
            </div>
            <div className="glass-card flex items-center justify-center space-x-2 rounded-3xl px-6 py-5 text-foreground">
              <CheckCircle className="text-primary" size={20} />
              <span>Task Management</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h2 className="mb-8 text-3xl font-bold text-foreground">Explore the App</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Jump straight into the core screens used to manage work, teammates, and project health.
          </p>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard"
              className="glass-card rounded-3xl p-4 text-left transition hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold text-foreground">Dashboard</h3>
              <p className="text-sm text-muted-foreground">Main dashboard view</p>
            </Link>

            <Link
              href="/projects"
              className="glass-card rounded-3xl p-4 text-left transition hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold text-foreground">Projects</h3>
              <p className="text-sm text-muted-foreground">Projects listing page</p>
            </Link>

            <Link
              href="/projects/1"
              className="glass-card rounded-3xl p-4 text-left transition hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold text-foreground">Kanban Board</h3>
              <p className="text-sm text-muted-foreground">Project board view</p>
            </Link>

            <Link
              href="/sign-in"
              className="glass-card rounded-3xl p-4 text-left transition hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold text-foreground">Account Access</h3>
              <p className="text-sm text-muted-foreground">Sign in or create a workspace account</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Core Capabilities
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {productHighlights.map((item) => (
              <div key={item.title} className="glass-card rounded-3xl p-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Shield size={14} />
                  {item.state}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
