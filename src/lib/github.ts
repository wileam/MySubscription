export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

const PER_PAGE = 15;

export async function fetchUserRepos(accessToken: string, page = 1): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=${PER_PAGE}&page=${page}&type=all`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

export { PER_PAGE };
