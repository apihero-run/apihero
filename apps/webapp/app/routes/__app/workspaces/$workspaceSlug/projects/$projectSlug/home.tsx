import type { LoaderArgs } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import { getProjectFromSlugs } from "~/models/project.server";
import { requireUserId } from "~/services/session.server";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { Outlet, useParams } from "@remix-run/react";
import { LogsOnboarding } from "~/libraries/ui/src/components/LogsOnboarding";
import type { UseDataFunctionReturn } from "remix-typedjson/dist/remix";
import { hasLogsInProject, searchLogsInProject } from "~/services/logs.server";

export type LoaderData = UseDataFunctionReturn<typeof loader>;

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireUserId(request);
  const { projectSlug, workspaceSlug } = params;
  invariant(workspaceSlug, "workspaceSlug not found");
  invariant(projectSlug, "projectSlug not found");

  const project = await getProjectFromSlugs({
    workspaceSlug,
    slug: projectSlug,
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const logs = await searchLogsInProject(searchParams, project.id);
  const hasLogs = await hasLogsInProject(project.id);

  return typedjson({ project, hasLogs, logs });
};

export default function Page() {
  const data = useTypedLoaderData<typeof loader>();
  const { workspaceSlug } = useParams();

  return (
    <main className="grid grid-rows-[auto_auto_auto_3fr] h-full w-full bg-slate-50 py-4 pl-4 overflow-y-auto">
      <LogsOnboarding
        project={data.project}
        logs={data.logs}
        hasLogs={data.hasLogs}
        workspaceSlug={workspaceSlug ?? ""}
      />
      <Outlet />
    </main>
  );
}
