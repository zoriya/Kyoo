import { useEffect, useState } from "react";
import { z } from "zod/v4";
import { useToken } from "~/providers/account-context";

const Presign = z.object({ signature: z.string() });

export const usePresign = (
	request: {
		for: (({ url: string } | { prefix: string }) & { verb: string })[];
		claims?: { wsRoutes: string[] };
		duration: string;
	} | null,
) => {
	const { apiUrl, authToken } = useToken();
	const body = request ? JSON.stringify(request) : null;
	const [presign, setPresign] = useState<{
		for: string;
		signature: string | null;
	}>();

	useEffect(() => {
		if (!authToken || !body) return;
		const abort = new AbortController();
		(async () => {
			const res = await fetch(`${apiUrl}/auth/presign`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authToken}`,
					"Content-Type": "application/json",
				},
				body,
				signal: abort.signal,
			}).catch(() => null);
			const answer = Presign.safeParse(
				res?.ok ? await res.json().catch(() => null) : null,
			);
			if (abort.signal.aborted) return;
			setPresign({
				for: body,
				signature: answer.success ? answer.data.signature : null,
			});
		})();
		return () => abort.abort();
	}, [apiUrl, authToken, body]);

	if (!authToken) return null;
	return body && presign?.for === body ? presign.signature : undefined;
};
