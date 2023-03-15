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

// import "raf/polyfill";
// import "setimmediate";
// import "react-native-reanimated";
import React from "react";

// // FIXME need reanimated update, see https://github.com/software-mansion/react-native-reanimated/issues/3355
// if (typeof window !== "undefined") {
// 	// @ts-ignore
// 	window._frameTimestamp = null;
// }
// Simply silence a SSR warning (see https://github.com/facebook/react/issues/14927 for more details)
if (typeof window === "undefined") {
	React.useLayoutEffect = React.useEffect;
}
