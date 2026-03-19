import { ProjectCard } from "@/components/project-card";

const projects = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design and improved UX",
    progress: 75,
    members: 5,
    dueDate: "2024-02-15",
    status: "In Progress",
    color: "bg-primary",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "iOS and Android app development for customer portal",
    progress: 45,
    members: 8,
    dueDate: "2024-03-20",
    status: "In Progress",
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "Marketing Campaign",
    description: "Q1 marketing campaign planning and execution",
    progress: 90,
    members: 3,
    dueDate: "2024-01-30",
    status: "Review",
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "Database Migration",
    description: "Migrate legacy database to new cloud infrastructure",
    progress: 30,
    members: 4,
    dueDate: "2024-04-10",
    status: "Planning",
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Security Audit",
    description: "Comprehensive security audit and vulnerability assessment",
    progress: 60,
    members: 2,
    dueDate: "2024-02-28",
    status: "In Progress",
    color: "bg-red-500",
  },
  {
    id: "6",
    name: "API Documentation",
    description: "Create comprehensive API documentation for developers",
    progress: 85,
    members: 3,
    dueDate: "2024-02-05",
    status: "Review",
    color: "bg-indigo-500",
  },
];

export function ProjectGrid() {
  function mapStatus(status: string): "active" | "completed" | "on-hold" {
    if (status === "Review") {
      return "completed";
    }

    if (status === "Planning") {
      return "on-hold";
    }

    return "active";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            progress: project.progress,
            memberCount: project.members,
            dueDate: project.dueDate,
            status: mapStatus(project.status),
            role: project.status,
          }}
        />
      ))}
    </div>
  );
}
