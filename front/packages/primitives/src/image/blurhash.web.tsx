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

import { decode } from "blurhash";
import {
	HTMLAttributes,
	ReactElement,
	forwardRef,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useYoshiki } from "yoshiki";
import { nativeStyleToCss } from "yoshiki/native";

// The blurhashToUrl has been stolen from https://gist.github.com/mattiaz9/53cb67040fa135cb395b1d015a200aff
export function blurHashToDataURL(hash: string | undefined): string | undefined {
	if (!hash) return undefined;

	const pixels = decode(hash, 32, 32);
	const dataURL = parsePixels(pixels, 32, 32);
	return dataURL;
}

// thanks to https://github.com/wheany/js-png-encoder
function parsePixels(pixels: Uint8ClampedArray, width: number, height: number) {
	const pixelsString = Array.from(pixels)
		.map((byte) => String.fromCharCode(byte))
		.join("");
	const pngString = generatePng(width, height, pixelsString);
	const dataURL =
		typeof Buffer !== "undefined"
			? Buffer.from(getPngArray(pngString)).toString("base64")
			: btoa(pngString);
	return `data:image/png;base64,${dataURL}`;
}

function getPngArray(pngString: string) {
	const pngArray = new Uint8Array(pngString.length);
	for (let i = 0; i < pngString.length; i++) {
		pngArray[i] = pngString.charCodeAt(i);
	}
	return pngArray;
}

function generatePng(width: number, height: number, rgbaString: string) {
	const DEFLATE_METHOD = String.fromCharCode(0x78, 0x01);
	const CRC_TABLE: number[] = [];
	const SIGNATURE = String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10);
	const NO_FILTER = String.fromCharCode(0);

	// biome-ignore lint: not gonna fix stackowerflow code that works
	let n, c, k;

	// make crc table
	for (n = 0; n < 256; n++) {
		c = n;
		for (k = 0; k < 8; k++) {
			if (c & 1) {
				c = 0xedb88320 ^ (c >>> 1);
			} else {
				c = c >>> 1;
			}
		}
		CRC_TABLE[n] = c;
	}

	// Functions
	function inflateStore(data: string) {
		const MAX_STORE_LENGTH = 65535;
		let storeBuffer = "";
		// biome-ignore lint: not gonna fix stackowerflow code that works
		let remaining;
		// biome-ignore lint: not gonna fix stackowerflow code that works
		let blockType;

		for (let i = 0; i < data.length; i += MAX_STORE_LENGTH) {
			remaining = data.length - i;
			blockType = "";

			if (remaining <= MAX_STORE_LENGTH) {
				blockType = String.fromCharCode(0x01);
			} else {
				remaining = MAX_STORE_LENGTH;
				blockType = String.fromCharCode(0x00);
			}
			// little-endian
			storeBuffer += blockType + String.fromCharCode(remaining & 0xff, (remaining & 0xff00) >>> 8);
			storeBuffer += String.fromCharCode(~remaining & 0xff, (~remaining & 0xff00) >>> 8);

			storeBuffer += data.substring(i, i + remaining);
		}

		return storeBuffer;
	}

	function adler32(data: string) {
		const MOD_ADLER = 65521;
		let a = 1;
		let b = 0;

		for (let i = 0; i < data.length; i++) {
			a = (a + data.charCodeAt(i)) % MOD_ADLER;
			b = (b + a) % MOD_ADLER;
		}

		return (b << 16) | a;
	}

	function updateCrc(crc: number, buf: string) {
		let c = crc;
		let b: number;

		for (let n = 0; n < buf.length; n++) {
			b = buf.charCodeAt(n);
			c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
		}
		return c;
	}

	function crc(buf: string) {
		return updateCrc(0xffffffff, buf) ^ 0xffffffff;
	}

	function dwordAsString(dword: number) {
		return String.fromCharCode(
			(dword & 0xff000000) >>> 24,
			(dword & 0x00ff0000) >>> 16,
			(dword & 0x0000ff00) >>> 8,
			dword & 0x000000ff,
		);
	}

	function createChunk(length: number, type: string, data: string) {
		const CRC = crc(type + data);

		return dwordAsString(length) + type + data + dwordAsString(CRC);
	}

	function createIHDR(width: number, height: number) {
		const IHDRdata =
			dwordAsString(width) +
			dwordAsString(height) +
			// bit depth
			String.fromCharCode(8) +
			// color type: 6=truecolor with alpha
			String.fromCharCode(6) +
			// compression method: 0=deflate, only allowed value
			String.fromCharCode(0) +
			// filtering: 0=adaptive, only allowed value
			String.fromCharCode(0) +
			// interlacing: 0=none
			String.fromCharCode(0);

		return createChunk(13, "IHDR", IHDRdata);
	}

	// PNG creations

	const IEND = createChunk(0, "IEND", "");
	const IHDR = createIHDR(width, height);

	let scanlines = "";
	let scanline: string;

	for (let y = 0; y < rgbaString.length; y += width * 4) {
		scanline = NO_FILTER;
		if (Array.isArray(rgbaString)) {
			for (let x = 0; x < width * 4; x++) {
				scanline += String.fromCharCode(rgbaString[y + x] & 0xff);
			}
		} else {
			scanline += rgbaString.substr(y, width * 4);
		}
		scanlines += scanline;
	}

	const compressedScanlines =
		DEFLATE_METHOD + inflateStore(scanlines) + dwordAsString(adler32(scanlines));
	const IDAT = createChunk(compressedScanlines.length, "IDAT", compressedScanlines);

	const pngString = SIGNATURE + IHDR + IDAT + IEND;
	return pngString;
}

const BlurhashCanvas = forwardRef<
	HTMLCanvasElement,
	{
		blurhash: string;
	} & HTMLAttributes<HTMLCanvasElement>
>(function BlurhashCanvas({ blurhash, ...props }, forwardedRef) {
	const ref = useRef<HTMLCanvasElement>(null);
	const { css } = useYoshiki();

	useImperativeHandle(forwardedRef, () => ref.current!, []);

	useLayoutEffect(() => {
		if (!ref.current) return;
		const pixels = decode(blurhash, 32, 32);
		const ctx = ref.current.getContext("2d");
		if (!ctx) return;
		const imageData = ctx.createImageData(32, 32);
		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);
	}, [blurhash]);

	return (
		<canvas
			ref={ref}
			width={32}
			height={32}
			{...css(
				{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					width: "100%",
					height: "100%",
				},
				props,
			)}
		/>
	);
});

const BlurhashDiv = forwardRef<
	HTMLDivElement,
	{ blurhash: string } & HTMLAttributes<HTMLDivElement>
>(function BlurhashDiv({ blurhash, ...props }, ref) {
	const { css } = useYoshiki();

	return (
		<div
			ref={ref}
			style={{
				// Use a blurhash here to nicely fade the NextImage when it is loaded completly
				// (this prevents loading the image line by line which is ugly and buggy on firefox)
				backgroundImage: `url(${blurHashToDataURL(blurhash)})`,
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "50% 50%",
			}}
			{...css(
				{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					width: "100%",
					height: "100%",
				},
				props,
			)}
		/>
	);
});

export const BlurhashContainer = ({
	blurhash,
	children,
	...props
}: {
	blurhash: string;
	children?: ReactElement | ReactElement[];
}) => {
	const { css } = useYoshiki();
	const ref = useRef<HTMLCanvasElement & HTMLDivElement>(null);
	const [renderType, setRenderType] = useState<"ssr" | "hydratation" | "client">(
		typeof window === "undefined" ? "ssr" : "hydratation",
	);

	useLayoutEffect(() => {
		// If the html is empty, it was not SSRed.
		if (ref.current?.innerHTML === "") setRenderType("client");
	}, []);

	return (
		<div
			{...css(
				{
					// To reproduce view's behavior
					boxSizing: "border-box",
					overflow: "hidden",
					position: "relative",
				},
				nativeStyleToCss(props),
			)}
		>
			{renderType === "ssr" && <BlurhashDiv ref={ref} blurhash={blurhash} />}
			{renderType === "client" && <BlurhashCanvas ref={ref} blurhash={blurhash} />}
			{renderType === "hydratation" && (
				<div ref={ref} dangerouslySetInnerHTML={{ __html: "" }} suppressHydrationWarning />
			)}
			{children}
		</div>
	);
};
