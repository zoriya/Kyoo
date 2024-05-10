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

// Stolen from https://github.com/necolas/react-native-web/issues/1026#issuecomment-1458279681

import type { AlertButton, AlertOptions } from "react-native";
import Swal, { type SweetAlertIcon } from "sweetalert2";

// biome-ignore lint/complexity/noStaticOnlyClass: Compatibility with rn
export class Alert {
	static alert(
		title: string,
		message?: string,
		buttons?: AlertButton[],
		options?: AlertOptions & { icon?: SweetAlertIcon },
	): void {
		const confirmButton = buttons
			? buttons.find((button) => button.style === "default")
			: undefined;
		const denyButton = buttons
			? buttons.find((button) => button.style === "destructive")
			: undefined;
		const cancelButton = buttons ? buttons.find((button) => button.style === "cancel") : undefined;

		Swal.fire({
			title: title,
			text: message,
			showConfirmButton: !!confirmButton,
			showDenyButton: !!denyButton,
			showCancelButton: !!cancelButton,
			confirmButtonText: confirmButton?.text,
			denyButtonText: denyButton?.text,
			cancelButtonText: cancelButton?.text,
			icon: options?.icon,
		}).then((result) => {
			if (result.isConfirmed) {
				if (confirmButton?.onPress !== undefined) {
					confirmButton.onPress();
				}
			} else if (result.isDenied) {
				if (denyButton?.onPress !== undefined) {
					denyButton.onPress();
				}
			} else if (result.isDismissed) {
				if (cancelButton?.onPress !== undefined) {
					cancelButton.onPress();
				}
			}
		});
	}
}
