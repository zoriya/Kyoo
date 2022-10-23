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

import dynamic from "next/dynamic";
import Script from "next/script";
import { useEffect, useState } from "react";

// @ts-ignore
const CastController = dynamic(() => import("./state").then((x) => x.CastController), {
	loading: () => null,
});

export const CastProvider = () => {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		window.__onGCastApiAvailable = (isAvailable) => {
			if (!isAvailable) return;
			cast.framework.CastContext.getInstance().setOptions({
				receiverApplicationId: process.env.CAST_APPLICATION_ID,
				autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
			});
		};
	}, []);

	return (
		<>
			<Script
				src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
				strategy="lazyOnload"
				onReady={() => setLoaded(true)}
			/>
			{loaded && <CastController />}
		</>
	);
};
