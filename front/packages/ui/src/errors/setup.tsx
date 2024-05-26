import { Main } from "@expo/html-elements";
import { type QueryPage, SetupStep } from "@kyoo/models";
import { Button, Icon, Link, P, ts } from "@kyoo/primitives";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "solito/router";
import { useYoshiki } from "yoshiki/native";
import { Navbar, NavbarProfile } from "../navbar";
import { KyooLongLogo } from "../navbar/icon";

export const SetupPage: QueryPage<{ step: SetupStep }> = ({ step }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();
	const isValid = Object.values(SetupStep).includes(step) && step !== SetupStep.Done;

	useEffect(() => {
		if (!isValid) router.replace("/");
	}, [isValid, router]);

	if (!isValid) return <P>Loading...</P>;

	return (
		<Main {...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}>
			<P>{t(`errors.setup.${step}`)}</P>
			{step === SetupStep.MissingAdminAccount && (
				<Button
					as={Link}
					href={"/register"}
					text={t("login.register")}
					licon={<Icon icon={Register} {...css({ marginRight: ts(2) })} />}
				/>
			)}
		</Main>
	);
};

SetupPage.getLayout = ({ page }) => {
	const { css } = useYoshiki();

	return (
		<>
			<Navbar left={<KyooLongLogo {...css({ marginX: ts(2) })} />} right={<NavbarProfile />} />
			{page}
		</>
	);
};
