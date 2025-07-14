// import { useFetch } from "~/query";
// import { useAccount } from "./account-context";
// import { ServerInfoP } from "~/models/resources/server-info";

// export const useHasPermission = (perms?: string[]) => {
// 	const account = useAccount();
// 	const { data } = useFetch({
// 		path: ["info"],
// 		parser: ServerInfoP,
// 	});
//
// 	if (!perms || !perms[0]) return true;
//
// 	const available = account?.permissions ?? data?.guestPermissions;
// 	if (!available) return false;
// 	return perms.every((perm) => available.includes(perm));
// };
