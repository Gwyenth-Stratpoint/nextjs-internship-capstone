import { CreateOrganization, OrganizationList } from "@clerk/nextjs";
import { Building2, Sparkles } from "lucide-react";

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Workspace setup</h1>
        <p className="mt-2 text-muted-foreground">
          Choose the active workspace for this session, then keep project-level permissions inside your own app.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="glass-shell rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your workspaces</h2>
              <p className="text-sm text-muted-foreground">Switch the active Clerk organization that should scope your projects.</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/60 bg-white/75 p-4">
            <OrganizationList
              hidePersonal
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
            />
          </div>
        </section>

        <section className="glass-shell rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create a workspace</h2>
              <p className="text-sm text-muted-foreground">
                This is still Clerk-powered for free invites, but lives inside the same visual language as the rest of your app.
              </p>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/60 bg-white/75 p-4">
            <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
          </div>
        </section>
      </div>
    </div>
  );
}
