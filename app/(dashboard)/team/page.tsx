import { requireActiveClerkOrgId } from "@/lib/auth";
import { getOrganizationTeamSnapshot } from "@/lib/server/team-crud";
import TeamPageClient from "@/components/team-page-client";

export default async function TeamPage() {
  const orgId = await requireActiveClerkOrgId();
  const snapshot = await getOrganizationTeamSnapshot(orgId);

  return <TeamPageClient snapshot={snapshot} />;
}
