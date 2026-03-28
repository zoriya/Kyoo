import { ProfileScreen } from "~/ui/profile";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function MyProfilePage() {
	return <ProfileScreen slug="me" />;
}
