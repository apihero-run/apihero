import { prisma } from "~/db.server";
import type { Workspace, Project, User } from "@prisma/client";
import slug from "slug";
export type { Project } from "@prisma/client";

export function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { workspace: true },
  });
}

export function getProject({
  workspaceId,
  id,
}: Pick<Project, "id"> & {
  workspaceId: Workspace["id"];
}) {
  return prisma.project.findFirst({
    where: { id, workspaceId },
  });
}

export function getProjectFromSlugs({
  workspaceSlug,
  slug,
}: Pick<Project, "slug"> & {
  workspaceSlug: Workspace["slug"];
}) {
  return prisma.project.findFirst({
    where: { slug, workspace: { slug: workspaceSlug } },
    include: {
      httpClients: {
        include: {
          integration: {
            include: {
              currentSchema: {
                select: {
                  servers: true,
                  id: true,
                },
              },
            },
          },
          authentications: {
            include: {
              securityScheme: true,
            },
          },
          endpoints: {
            include: {
              operation: {
                include: {
                  path: true,
                  securityRequirements: {
                    include: {
                      securityScheme: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export function getProjectByKey(id: string, slug: string) {
  return prisma.project.findFirst({
    where: { id },
    include: {
      workspace: true,
      httpClients: {
        where: {
          integration: {
            slug,
          },
        },
        include: {
          authentications: {
            include: {
              securityScheme: true,
            },
          },
        },
      },
    },
  });
}

export function getProjects({ workspaceId }: { workspaceId: Workspace["id"] }) {
  return prisma.project.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
}

export function createProject({
  title,
  workspaceId,
}: Pick<Project, "title"> & {
  workspaceId: Workspace["id"];
}) {
  const desiredSlug = slug(title);
  return prisma.project.create({
    data: {
      title,
      slug: desiredSlug,
      workspace: {
        connect: {
          id: workspaceId,
        },
      },
    },
  });
}

export function deleteProject({
  id,
  userId,
}: Pick<Project, "id"> & {
  userId: User["id"];
}) {
  return prisma.project.deleteMany({
    where: {
      id,
      workspace: {
        users: {
          some: { id: userId },
        },
      },
    },
  });
}
