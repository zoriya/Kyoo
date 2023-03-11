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

import { motify } from "moti";
import { Component, ComponentType, FunctionComponent } from "react";
import { Poster } from "./image";

const getDisplayName = (Cmp: ComponentType<any>) => {
	return Cmp.displayName || Cmp.name || "Component";
};

const asClass = <Props,>(Cmp: FunctionComponent<Props>) => {
	// TODO: ensure that every props is given at least once.
	return class AsClass extends Component<Partial<Props> & { forward?: Partial<Props> }> {
		static displayName = `WithClass(${getDisplayName(Cmp)})`;

		constructor(props: Partial<Props> & { forward?: Partial<Props> }) {
			super(props);
		}

		render() {
			// @ts-ignore See todo above
			return <Cmp {...this.props} {...this.props.forward} />;
		}
	};
};

export const Animated = {
	Poster: motify(asClass(Poster))(),
};
