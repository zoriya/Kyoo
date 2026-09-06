import "~/global.css";
import { Uniwind } from "uniwind";

export const rem = (spacing: number) => {
	const unit = Uniwind.getCSSVariable("--spacing");
	const px =
		typeof unit === "number"
			? unit
			: Number.parseFloat(unit ?? "") * (unit?.endsWith("rem") ? 16 : 1);
	return spacing * (Number.isNaN(px) ? 4 : px);
};
