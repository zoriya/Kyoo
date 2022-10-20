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

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, (loadRequestData) => {
	console.log(loadRequestData)
	const error = new cast.framework.messages.ErrorData(
		cast.framework.messages.ErrorType.LOAD_FAILED,
	);
	if (!loadRequestData.media) {
		error.reason = cast.framework.messages.ErrorReason.INVALID_PARAMS;
		return error;
	}

	if (!loadRequestData.media.entity) {
		return loadRequestData;
	}

	return loadRequestData;
	/* return thirdparty */
	/* 	.fetchAssetAndAuth(loadRequestData.media.entity, loadRequestData.credentials) */
	/* 	.then((asset) => { */
	/* 		if (!asset) { */
	/* 			throw cast.framework.messages.ErrorReason.INVALID_REQUEST; */
	/* 		} */

	/* 		loadRequestData.media.contentUrl = asset.url; */
	/* 		loadRequestData.media.metadata = asset.metadata; */
	/* 		loadRequestData.media.tracks = asset.tracks; */
	/* 		return loadRequestData; */
	/* 	}) */
	/* 	.catch((reason) => { */
	/* 		error.reason = reason; // cast.framework.messages.ErrorReason */
	/* 		return error; */
	/* 	}); */
});

context.start();
