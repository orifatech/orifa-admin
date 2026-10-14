"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { Octokit } from "@octokit/rest";
import { api } from "../_generated/api";

function setDeepKey(obj: Record<string, any>, path: string, value: any) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

export type PublishResult = {
  mode: "pull_request" | "direct_commit";
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  commitUrl?: string;
  commitSha?: string;
  branchName: string;
  modifiedFilesCount: number;
};

export const publishChanges = action({
  args: {
    projectId: v.id("projects"),
    changeIds: v.array(v.id("stagedChanges")),
    customTitle: v.optional(v.string()),
    customDescription: v.optional(v.string()),
    forceMode: v.optional(v.union(v.literal("pull_request"), v.literal("direct_commit"))),
  },
  handler: async (ctx, args): Promise<PublishResult> => {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "GitHub Access Token is missing. Please configure GITHUB_TOKEN in your Convex environment variables."
      );
    }

    const octokit = new Octokit({ auth: token });

    // 1. Fetch project details
    const project: any = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
    if (!project) throw new Error("Project not found.");

    const owner = project.githubRepoOwner;
    const repo = project.githubRepoName;
    const baseBranch = project.githubDefaultBranch || "main";

    // Determine publishing mode: client maintenance contract -> PR review; no contract -> direct commit
    const publishMode: "pull_request" | "direct_commit" =
      args.forceMode || project.gitPublishMode || "pull_request";

    // 2. Fetch staged changes
    const allProjectChanges: any[] = await ctx.runQuery(api.stagedChanges.listByProject, {
      projectId: args.projectId,
    });
    const targetChanges = allProjectChanges.filter((c: any) =>
      args.changeIds.includes(c._id)
    );

    if (targetChanges.length === 0) {
      throw new Error("No staged changes found to commit.");
    }

    // 3. Get latest commit SHA on base branch
    const { data: baseRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = baseRef.object.sha;

    // 4. Determine target branch
    const timestamp = Date.now();
    let targetBranch = baseBranch;
    let featureBranchName = "";

    if (publishMode === "pull_request") {
      featureBranchName = `orifa-update-${timestamp}`;
      targetBranch = featureBranchName;

      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${featureBranchName}`,
        sha: baseSha,
      });
    }

    // 5. Group changes by target file and apply updates
    const changesByFile = new Map<string, typeof targetChanges>();
    for (const ch of targetChanges) {
      const list = changesByFile.get(ch.targetFile) || [];
      list.push(ch);
      changesByFile.set(ch.targetFile, list);
    }

    let lastCommitSha = "";
    let lastCommitUrl = "";

    for (const [filePath, fileChanges] of changesByFile.entries()) {
      let fileSha: string | undefined;
      let currentContent: any = {};

      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: targetBranch,
        });

        if (!Array.isArray(fileData) && fileData.type === "file") {
          fileSha = fileData.sha;
          const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
          if (filePath.endsWith(".json")) {
            currentContent = JSON.parse(decoded);
          } else {
            currentContent = decoded;
          }
        }
      } catch (_err: any) {
        // File may be new on target branch
      }

      let updatedContentStr = "";
      if (filePath.endsWith(".json")) {
        for (const ch of fileChanges) {
          setDeepKey(currentContent, ch.contentKey, ch.proposedValue);
        }
        updatedContentStr = JSON.stringify(currentContent, null, 2) + "\n";
      } else {
        // Markdown or raw text
        const latestChange = fileChanges[fileChanges.length - 1];
        updatedContentStr = latestChange.proposedValue;
      }

      const commitMessage =
        publishMode === "direct_commit"
          ? `feat(cms): direct update ${filePath} to production via Orifa Admin`
          : `chore(cms): update ${filePath} via Orifa Admin`;

      const { data: commitRes } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: commitMessage,
        content: Buffer.from(updatedContentStr).toString("base64"),
        sha: fileSha,
        branch: targetBranch,
      });

      lastCommitSha = commitRes.commit.sha || "";
      lastCommitUrl = commitRes.commit.html_url || "";
    }

    // 6. Branch workflow based on publishMode
    if (publishMode === "direct_commit") {
      const directCommitUrl =
        lastCommitUrl || `https://github.com/${owner}/${repo}/commits/${baseBranch}`;

      await ctx.runMutation(api.stagedChanges.markDirectCommitted, {
        changeIds: args.changeIds,
        commitUrl: directCommitUrl,
        commitSha: lastCommitSha,
        branchName: baseBranch,
      });

      return {
        mode: "direct_commit",
        commitUrl: directCommitUrl,
        commitSha: lastCommitSha,
        branchName: baseBranch,
        modifiedFilesCount: changesByFile.size,
      };
    }

    // 7. Pull Request workflow (for maintenance contract clients)
    const tableRows = targetChanges
      .map(
        (c: any) =>
          `| \`${c.targetFile}\` | \`${c.contentKey}\` | \`${c.contentType}\` | ${
            c.originalValue.length > 50
              ? c.originalValue.slice(0, 47) + "..."
              : c.originalValue
          } | **${
            c.proposedValue.length > 50
              ? c.proposedValue.slice(0, 47) + "..."
              : c.proposedValue
          }** |`
      )
      .join("\n");

    const prBody = `## 🚀 CMS Content Update

This Pull Request was automatically prepared by **Orifa Admin Platform** for review under the client's maintenance contract.

### Summary of Changes:
| Target File | Key | Type | Original | Proposed |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}

${args.customDescription ? `\n### Reviewer Notes:\n${args.customDescription}` : ""}

---
*Generated by Orifa Technologies Hub | Branch: \`${featureBranchName}\`*
`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title:
        args.customTitle ||
        `CMS Update: ${targetChanges.length} change${
          targetChanges.length > 1 ? "s" : ""
        } on ${new Date().toLocaleDateString()}`,
      head: featureBranchName,
      base: baseBranch,
      body: prBody,
    });

    await ctx.runMutation(api.stagedChanges.markPRCreated, {
      changeIds: args.changeIds,
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
      branchName: featureBranchName,
    });

    return {
      mode: "pull_request",
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
      branchName: featureBranchName,
      modifiedFilesCount: changesByFile.size,
    };
  },
});

// Alias for backward compatibility
export const createPullRequest = publishChanges;
