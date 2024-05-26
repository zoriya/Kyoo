import { SetupStep, type QueryPage } from "@kyoo/models";
import { Button, Icon, Link, P, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { Main } from "@expo/html-elements";
import { useYoshiki } from "yoshiki/native";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import { Navbar, NavbarProfile } from "../navbar";

export const SetupPage: QueryPage<{ step: Exclude<SetupStep, SetupStep.Done> }> = ({ step }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<>
			<Navbar left={null} right={<NavbarProfile />} />
			<Main
				{...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}
			>
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
		</>
	);
};
