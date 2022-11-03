/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { Paragraph } from "@kyoo/primitives";
import { View } from "react-native";
import { KyooLongLogo } from "./icon";

export const Navbar = () => {
	/* const { t } = useTranslation("common"); */
	/* const { data, error, isSuccess, isError } = useFetch(Navbar.query()); */

	return (
		<View css={(theme) => ({ backgroundColor: theme.appbar })}>
			<KyooLongLogo height="64px" width="auto" />
			<Paragraph>Toto</Paragraph>
			{/* <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}> */}
			{/* 	{isSuccess */}
			{/* 		? data.items.map((library) => ( */}
			{/* 				<ButtonLink */}
			{/* 					href={`/browse/${library.slug}`} */}
			{/* 					key={library.slug} */}
			{/* 					sx={{ color: "white" }} */}
			{/* 				> */}
			{/* 					{library.name} */}
			{/* 				</ButtonLink> */}
			{/* 		  )) */}
			{/* 		: [...Array(4)].map((_, i) => ( */}
			{/* 				<Typography key={i} variant="button" px=".25rem"> */}
			{/* 					<Skeleton width="5rem" /> */}
			{/* 				</Typography> */}
			{/* 		  ))} */}
			{/* </Box> */}
			<View>{/* <Avatar alt={t("navbar.login")} /> */}</View>
			{/* {isError && <ErrorSnackbar error={error} />} */}
		</View>
	);
};

/* Navbar.query = (): QueryIdentifier<Page<Library>> => ({ */
/* 	parser: Paged(LibraryP), */
/* 	path: ["libraries"], */
/* }); */
