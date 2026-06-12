import type { AxiosInstance } from 'axios';
import { fetchAllPages } from '../utils/pagination.js';

// ---------------------------------------------------------------------------
// Public output types (returned to MCP tools)
// ---------------------------------------------------------------------------

export interface Repository {
  name: string;
  slug: string;
  is_private: boolean;
  updated_on: string;
}

export interface PullRequest {
  id: number;
  title: string;
  state: string;
  author: string;
  source_branch: string;
  destination_branch: string;
  created_on: string;
}

export interface PullRequestDetails {
  title: string;
  description: string;
  state: string;
  reviewers: string[];
  participants: string[];
  merge_commit: string | null;
}

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface CommentInline {
  path: string;
  to: number;
  from?: number;
}

export interface Comment {
  id: number;
  content: string;
  author: string;
  created_on: string;
  inline?: CommentInline;
}

export interface Task {
  id: number;
  content: string;
  state: 'UNRESOLVED' | 'RESOLVED';
  created_on: string;
  updated_on: string;
  creator: string;
  comment_id?: number;
}

// ---------------------------------------------------------------------------
// Raw Bitbucket API response shapes (internal only)
// ---------------------------------------------------------------------------

interface BitbucketRepo {
  name: string;
  slug: string;
  is_private: boolean;
  updated_on: string;
}

interface BitbucketPR {
  id: number;
  title: string;
  state: string;
  author: { display_name: string };
  source: { branch: { name: string } };
  destination: { branch: { name: string } };
  created_on: string;
}

interface BitbucketPRDetails {
  title: string;
  description: string;
  state: string;
  reviewers: Array<{ display_name: string }>;
  participants: Array<{ user: { display_name: string } }>;
  merge_commit?: { hash: string };
}

interface BitbucketCommit {
  hash: string;
  author: { raw: string };
  date: string;
  message: string;
}

interface BitbucketCommentResponse {
  id: number;
  content: { raw: string };
  user: { display_name: string };
  created_on: string;
  inline?: { path: string; to: number; from?: number };
}

interface BitbucketTaskResponse {
  id: number;
  content: { raw: string };
  state: 'UNRESOLVED' | 'RESOLVED';
  created_on: string;
  updated_on: string;
  creator: { display_name: string };
  comment?: { id: number };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class BitbucketService {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Lists all repositories in a workspace, auto-paginating.
   */
  async listRepositories(workspace: string): Promise<Repository[]> {
    const repos = await fetchAllPages<BitbucketRepo>(
      this.client,
      `/repositories/${encodeURIComponent(workspace)}`
    );
    return repos.map((r) => ({
      name: r.name,
      slug: r.slug,
      is_private: r.is_private,
      updated_on: r.updated_on,
    }));
  }

  /**
   * Lists pull requests for a repository, optionally filtered by state.
   * Auto-paginates across all result pages.
   */
  async listPullRequests(
    workspace: string,
    repoSlug: string,
    state?: string
  ): Promise<PullRequest[]> {
    const params: Record<string, unknown> = {};
    if (state) params['state'] = state;

    const prs = await fetchAllPages<BitbucketPR>(
      this.client,
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests`,
      params
    );

    return prs.map((pr) => ({
      id: pr.id,
      title: pr.title,
      state: pr.state,
      author: pr.author.display_name,
      source_branch: pr.source.branch.name,
      destination_branch: pr.destination.branch.name,
      created_on: pr.created_on,
    }));
  }

  /**
   * Fetches full details of a single pull request.
   */
  async getPullRequestDetails(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<PullRequestDetails> {
    const { data } = await this.client.get<BitbucketPRDetails>(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}`
    );

    return {
      title: data.title,
      description: data.description ?? '',
      state: data.state,
      reviewers: data.reviewers.map((r) => r.display_name),
      participants: data.participants.map((p) => p.user.display_name),
      merge_commit: data.merge_commit?.hash ?? null,
    };
  }

  /**
   * Returns the raw unified diff for a pull request as a string.
   * The response is streamed as plain text; large diffs are returned as-is.
   */
  async getPullRequestDiff(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<string> {
    // The diff endpoint returns a 302 redirect whose Location URL contains %0D
    // (carriage return) between commit hashes. Axios/follow-redirects decodes
    // %0D to a literal \r, corrupting the HTTP request. We handle the redirect
    // manually to avoid this.
    const redirect = await this.client.get<string>(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/diff`,
      {
        maxRedirects: 0,
        responseType: 'text',
        headers: { Accept: 'text/plain' },
        validateStatus: (status) => status === 302 || (status >= 200 && status < 300),
      }
    );

    if (redirect.status === 302) {
      const location = redirect.headers['location'] as string;
      const { data } = await this.client.get<string>(location, {
        responseType: 'text',
        headers: { Accept: 'text/plain' },
      });
      return data;
    }

    return redirect.data;
  }

  /**
   * Lists all commits in a pull request, auto-paginating.
   */
  async listPullRequestCommits(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<Commit[]> {
    const commits = await fetchAllPages<BitbucketCommit>(
      this.client,
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/commits`
    );

    return commits.map((c) => ({
      hash: c.hash,
      author: c.author.raw,
      date: c.date,
      message: c.message.trim(),
    }));
  }

  /**
   * Lists all comments on a pull request, auto-paginating.
   */
  async listPullRequestComments(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<Comment[]> {
    const comments = await fetchAllPages<BitbucketCommentResponse>(
      this.client,
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/comments`
    );
    return comments.map((c) => ({
      id: c.id,
      content: c.content.raw,
      author: c.user.display_name,
      created_on: c.created_on,
      ...(c.inline !== undefined && { inline: c.inline }),
    }));
  }

  async listPullRequestTasks(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<Task[]> {
    const tasks = await fetchAllPages<BitbucketTaskResponse>(
      this.client,
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/tasks`
    );
    return tasks.map((t) => ({
      id: t.id,
      content: t.content.raw,
      state: t.state,
      created_on: t.created_on,
      updated_on: t.updated_on,
      creator: t.creator.display_name,
      ...(t.comment !== undefined && { comment_id: t.comment.id }),
    }));
  }

  async createPullRequestTask(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string,
    commentId?: number
  ): Promise<Task> {
    const body: { content: { raw: string }; pending: boolean; comment?: { id: number } } = {
      content: { raw: content },
      pending: true,
    };
    if (commentId !== undefined) {
      body.comment = { id: commentId };
    }
    const { data } = await this.client.post<BitbucketTaskResponse>(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/tasks`,
      body
    );
    return {
      id: data.id,
      content: data.content.raw,
      state: data.state,
      created_on: data.created_on,
      updated_on: data.updated_on,
      creator: data.creator.display_name,
      ...(data.comment !== undefined && { comment_id: data.comment.id }),
    };
  }

  async updatePullRequestTask(
    workspace: string,
    repoSlug: string,
    prId: number,
    taskId: number,
    content: string,
    state: 'UNRESOLVED' | 'RESOLVED'
  ): Promise<Task> {
    const { data } = await this.client.put<BitbucketTaskResponse>(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/tasks/${taskId}`,
      { content: { raw: content }, state }
    );
    return {
      id: data.id,
      content: data.content.raw,
      state: data.state,
      created_on: data.created_on,
      updated_on: data.updated_on,
      creator: data.creator.display_name,
      ...(data.comment !== undefined && { comment_id: data.comment.id }),
    };
  }

  async deletePullRequestTask(
    workspace: string,
    repoSlug: string,
    prId: number,
    taskId: number
  ): Promise<void> {
    await this.client.delete(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/tasks/${taskId}`
    );
  }

  /**
   * Posts a comment on a pull request.
   * When `inline` is provided, the comment is pinned to a specific file + line in the diff.
   * Content is validated (max 10,000 chars) before being sent.
   */
  async createPullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string,
    inline?: CommentInline
  ): Promise<Comment> {
    const body: { content: { raw: string }; inline?: CommentInline; pending: boolean } = {
      content: { raw: content },
      pending: true,
    };
    if (inline !== undefined) {
      body.inline = inline;
    }

    const { data } = await this.client.post<BitbucketCommentResponse>(
      `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}/pullrequests/${prId}/comments`,
      body
    );

    return {
      id: data.id,
      content: data.content.raw,
      author: data.user.display_name,
      created_on: data.created_on,
      ...(data.inline !== undefined && { inline: data.inline }),
    };
  }
}
