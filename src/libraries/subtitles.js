// A full list of supported features can be found here: https://github.com/AniDevTwitter/animeopenings/wiki/Subtitle-Features

/* List of Methods
Name				Arguments				Description
add					video[,filepath[,show]]	Adds subtitles to the given <video> element. Can also set the subtitle file to use and start showing it.
remove				video					Removes subtitles from the given <video> element.
show				video					Makes the subtitles associated with the given <video> element visible.
hide				video					Hides the subtitles associated with the given <video> element.
visible				video					Whether or not the subtitles associated with the given <video> element are currently visible.
setSubtitleFile		video,filepath			Sets/Changes the subtitle file to use for the given <video> element.
setBorderStyle		video,style				Sets the Border Style of the lines in the subtitle file used by the given <video> element.
											0	Use the styles specified in the subtitle file.
											1	Use Border Style 1 (text has an outline and a shadow)
											3	Use Border Style 3 (text outline becomes a background which has a shadow)
											4	Use Border Style 4 (text has an outline and its shadow becomes a background)
reload				video					Reloads the subtitle file used by the given <video> element.
*/

let SubtitleManager = (function() {
	"use strict";

	// from https://github.com/Yay295/fitCurves
	function fitCurve(points) {
		var add = (A,B) => [A[0]+B[0],A[1]+B[1]];
		var subtract = (A,B) => [A[0]-B[0],A[1]-B[1]];
		var multiply = (A,B) => [A[0]*B,A[1]*B];
		var divide = (A,B) => [A[0]/B,A[1]/B];
		var dot = (A,B) => A[0]*B[0]+A[1]*B[1];
		var norm = A => Math.sqrt((A[0]*A[0])+(A[1]*A[1]));
		var normalize = v => divide(v,norm(v));

		function bezier(ctrlPoly,t) {
			let tx = 1 - t;
			return	add(add(multiply(ctrlPoly[0], tx * tx * tx), multiply(ctrlPoly[1], 3 * tx * tx * t)), add(multiply(ctrlPoly[2], 3 * tx * t * t), multiply(ctrlPoly[3], t * t * t)));
		}

		points = points.filter((point,i) => (i === 0 || !(point[0] === points[i-1][0] && point[1] === points[i-1][1])));
		var len = points.length;
		if (len < 2) return [];

		var leftTangent = normalize(subtract(points[1],points[0]));
		var rightTangent = normalize(subtract(points[len-2],points[len-1]));
		if (len === 2) {
			var dist = norm(subtract(points[0], points[1])) / 3;
			return [points[0], add(points[0], multiply(leftTangent, dist)), add(points[1], multiply(rightTangent, dist)), points[1]];
		}

		var u = [0];
		for (let i = 1; i < len; ++i)
			u.push(u[i-1] + norm(subtract(points[i],points[i-1])));
		for (let i = 0; i < len; ++i)
			u[i] /= u[len-1];

		var bezCurve = [points[0], points[0], points[len-1], points[len-1]];
		var C = [0,0,0,0];
		var X = [0,0];

		for (let i = 0; i < len; ++i) {
			var ui = u[i];
			var ux = 1 - ui;
			var A = multiply(leftTangent, 3 * ux * ux * ui);
			var B = multiply(rightTangent, 3 * ux * ui * ui);

			C[0] += dot(A,A);
			C[1] += dot(A,B);
			C[2] += dot(A,B);
			C[3] += dot(B,B);

			var tmp = subtract(points[i],bezier(bezCurve,ui));
			X[0] += dot(A,tmp);
			X[1] += dot(B,tmp);
		}

		var det_C0_C1 = (C[0] * C[3]) - (C[2] * C[1]);
		var det_C0_X  = (C[0] * X[1]) - (C[2] * X[0]);
		var det_X_C1  = (X[0] * C[3]) - (X[1] * C[1]);
		var alpha_l = det_C0_C1 === 0 ? 0 : det_X_C1 / det_C0_C1;
		var alpha_r = det_C0_C1 === 0 ? 0 : det_C0_X / det_C0_C1;
		var segLength = norm(subtract(points[0], points[len-1]));
		var epsilon = 1.0e-6 * segLength;

		if (alpha_l < epsilon || alpha_r < epsilon)
			alpha_l = alpha_r = segLength / 3;
		bezCurve[1] = add(bezCurve[0], multiply(leftTangent, alpha_l));
		bezCurve[2] = add(bezCurve[3], multiply(rightTangent, alpha_r));

		return bezCurve;
	}
	// from https://github.com/Yay295/Compiled-Trie
	function generate_compiled_trie(keys) {
		let codes = keys.map(key => [].map.call(key, c => c.charCodeAt(0)));

		function get_next(root, code, i) {
			let num = code[i];
			if (num === undefined) root.set(NaN, NaN);
			else root.set(num, get_next(root.has(num) ? root.get(num) : new Map(), code, i + 1));
			return root;
		}
		let trie = new Map();
		for (let code of codes) {
			let num = code[0];
			trie.set(num, get_next(trie.has(num) ? trie.get(num) : new Map(), code, 1));
		}

		function to_conditional(root,i) {
			if (root.size == 1) {
				let [key,value] = root.entries().next().value;
				if (isNaN(key)) return [`return ${i};`];
				else return [
					`if (str.charCodeAt(${i}) === ${key}) {`,
						...to_conditional(value, i + 1).map(line => "\t" + line),
					"}"
				];
			} else {
				let has_end = false, lines = [`switch (str.charCodeAt(${i})) {`];
				for (let [code,value] of root) {
					if (isNaN(code)) has_end = true;
					else lines.push(
						`\tcase ${code}:`,
						...to_conditional(value,i+1).map(line => "\t\t" + line),
						"\t\tbreak;"
					);
				}
				if (has_end) lines.push("\tdefault:",`\t\treturn ${i};`);
				lines.push("}");
				return lines;
			}
		}
		let code = to_conditional(trie,0).join("\n");

		return new Function("str", "\"use strict;\"\n\n" + code + "\n\nreturn 0;");
	}

	function colorToARGB(color) {
		let hex;

		if (color.startsWith('&H')) {
			// Remove '&H' at start and '&' at end.
			hex = color.replace(/[&H]/gi,"");

			// Pad left with zeros.
			hex = ("00000000" + hex).slice(-8);
		} else {
			// Convert signed decimal to unsigned decimal to hex.
			hex = (color >>> 0).toString(16).toUpperCase();

			// If it's an odd length, add a '0' to the start.
			if (hex.length % 2 == 1)
				hex = "0" + hex;

			// Pad it on the right to 6 digits.
			hex = hex.padEnd(6,"0");
		}

		// Parse string.
		let a = 1 - (parseInt(hex.substr(0,2),16) / 255);
		let r = parseInt(hex.substr(6,2),16);
		let g = parseInt(hex.substr(4,2),16);
		let b = parseInt(hex.substr(2,2),16);

		return [a,r,g,b];
	}
	function styleNameToClassName(name) {
		name = name.replace(/_/g,"__"); // replace underscores with two underscores
		name = name.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/g,"_"); // replace problematic CSS characters with underscores
		return "subtitles_" + name; // add a prefix so it won't collide with anything else
	}

	function addInterpolatedTransition(full_data, start_time, end_time, start_value, end_value, accel) {
		// initialize the dataset with the original starting value
		if (!full_data) {
			full_data = {
				data: [{start_time: 0, end_time: 0, end_value: start_value, accel: 1}],
				points: null
			};
		}

		// add new data to list sorted by start time
		// points with the same start time are kept in insertion order
		let new_data = {start_time: start_time, end_time: end_time, end_value: end_value, accel: accel};
		let data = full_data.data;
		let index = data.findIndex(d => d.start_time > start_time);
		if (index == -1) data.push(new_data);
		else data.splice(index,0,new_data);

		// interpolate a series of [time,value,accel]
		if (true) {
			let points = [];
			let i, prev = data[0], curr;

			// get the first point
			for (i = 1; i < data.length; ++i) {
				curr = data[i];
				if (curr.end_time != 0) {
					points.push([0,prev.end_value,1]);
					break;
				}
				prev = curr;
			}
			if (i == data.length)
				points.push([0,prev.end_value,1]);

			// calculate the rest of the points
			for (; i < data.length; ++i) {
				curr = data[i];

				if (prev.end_time < curr.start_time && prev.end_value != curr.end_value) {
					points.push([curr.start_time,prev.end_value,1]);
				} else if (curr.start_time < prev.end_time) {
					let [prev_start_time,prev_start_value,prev_prev_accel] = points[points.length-2];
					let last = points[points.length-1];
					    last[0] = curr.start_time;
					    last[1] = prev_start_value + (prev.end_value - prev_start_value) * Math.pow((curr.start_time - prev_start_time) / (prev.end_time - prev_start_time), last[2]);
				}

				points.push([curr.end_time,curr.end_value,curr.accel]);
				prev = curr;
			}

			full_data.points = points;
		}

		// since full_data could have been null at the start
		// we need to return it instead of relying on pass-by-reference
		return full_data;
	}
	function calculateInterpolatedTransition(time,points) {
		let [prev_time,prev_value,accel] = points[0];
		let i, curr_time, curr_value, new_value;
		for (i = 1; i < points.length; ++i) {
			[curr_time,curr_value,accel] = points[i];

			if (time <= curr_time) {
				if (time == curr_time)
					new_value = curr_value;
				else
					new_value = prev_value + (curr_value - prev_value) * Math.pow((time - prev_time) / (curr_time - prev_time), accel);
				break;
			}

			[prev_time,prev_value] = [curr_time,curr_value];
		}
		if (i == points.length)
			new_value = prev_value;

		return new_value;
	}

	// For combining adjacent override blocks.
	let reAdjacentBlocks = /({[^}]*)}{([^}]*})/g;
	let combineAdjacentBlocks = text => text.replace(reAdjacentBlocks,"$1$2").replace(reAdjacentBlocks,"$1$2");

	// Map to convert SSAv4 alignment values to ASSv4+ values.
	//                          1, 2, 3,    5, 6, 7,    9, 10, 11
	let SSA_ALIGNMENT_MAP = [0, 1, 2, 3, 0, 7, 8, 9, 0, 4,  5,  6];

	// Alias for creating SVG elements.
	let createSVGElement = document.createElementNS.bind(document,"http://www.w3.org/2000/svg");

	function Renderer(SC,video) {
		// SC == Subtitle Container
		// video == <video> element

		this.styles = {};
		this.WrapStyle = 2;
		this.width = 0;
		this.height = 0;

		let counter = 0;
		let getID = () => ++counter;

		let computedPaths = {};
		let fontMetrics = {};
		let lastTime = -1;
		let renderer = this;
		let TimeOffset, PlaybackSpeed, ScaledBorderAndShadow;
		let initRequest, rendererBorderStyle, fontCSS, styleCSS, subFile, subtitles = [], collisions, reverseCollisions;

		let STATES = Object.freeze({UNINITIALIZED: 1, INITIALIZING: 2, RESTARTING_INIT: 3, INITIALIZED: 4, USED: 5});
		let state = STATES.UNINITIALIZED;
		let paused = true;

		// If the given string starts with an open paren and ends with a close paren.
		let isParenthesized = str => str.charCodeAt(0) === 40 && str.charCodeAt(str.length-1) === 41;


		// Functions to help manage when things are executed in the event loop.
		let [addTask, addMicrotask, addAnimationTask] = (function() {
			// Use this instead of setTimeout(func,0) to get around the 4ms delay.
			// https://dbaron.org/log/20100309-faster-timeouts
			// Modified to use Message Channels.
			let timeouts = [];
			let channel = new MessageChannel();
			channel.port1.onmessage = evt => timeouts.length > 0 ? timeouts.shift()() : null;
			let addTask = func => channel.port2.postMessage(timeouts.push(func));

			// Fulfilled promises create microtasks.
			let promise = Promise.resolve(true);
			let addMicrotask = window.queueMicrotask || (func => promise = promise.then(func));

			// We can just use requestAnimationFrame to create an animation task.

			return [addTask, addMicrotask, window.requestAnimationFrame];
		})();

		// For some overrides that are parsed in multiple locations.
		let overrideParse = {
			"be": function(arg) {
				let val = parseInt(arg,10) || 0;
				if (val < 0) val = 0;
				return val;
			},
			"blur": function(arg) {
				let val = parseFloat(arg) || 0;
				if (val < 0) val = 0;
				return val;
			},
			"fs": function(arg) {
				let style = renderer.styles[this.style.Name];
				let num = parseFloat(arg);

				if (!num)
					return style.Fontsize;
				if (arg.charAt(0) == "+" || arg.charAt(0) == "-")
					return this.style.Fontsize * (1 + (num / 10));
				return num;
			},
			"fscx": function(arg) {
				return arg ? parseFloat(arg) : renderer.styles[this.style.Name].ScaleX;
			},
			"fscy": function(arg) {
				return arg ? parseFloat(arg) : renderer.styles[this.style.Name].ScaleY;
			},
			"fsp": function(arg) {
				return arg ? parseFloat(arg) : renderer.styles[this.style.Name].Spacing;
			},
			"pos": function(arg) {
				return arg.split(",").map(parseFloat);
			}
		};

		// Handles subtitle line overrides.
		// Must be `call`ed from a LinePiece with `this`.
		let map = {
			"b" : function(arg,data) {
				data.style["font-weight"] = +arg ? (arg == "1" ? "bold" : arg) : "inherit";
				this.cachedBBox.width = this.cachedBBox.width && NaN;
			},
			"i" : function(arg,data) {
				this.style.Italic = !!+arg;
				data.style["font-style"] = this.style.Italic ? "italic" : "inherit";
				this.cachedBBox.width = this.cachedBBox.width && NaN;
				this.cachedBBox.height = NaN;
			},
			"u" : function(arg,data) {
				let RSTD = data.style["text-decoration"], newVal;
				if (+arg)
					newVal = RSTD ? "underline line-through" : "underline";
				else
					newVal = RSTD.includes("line-through") ? "line-through" : "initial";
				data.style["text-decoration"] = newVal;
			},
			"s" : function(arg,data) {
				let RSTD = data.style["text-decoration"], newVal;
				if (+arg)
					newVal = RSTD ? "underline line-through" : "line-through";
				else
					newVal = RSTD.includes("underline") ? "underline" : "initial";
				data.style["text-decoration"] = newVal;
			},
			"alpha" : function(arg) {
				if (!arg) {
					var pStyle = renderer.styles[this.style.Name];
					this.style.c1a = pStyle.c1a;
					this.style.c2a = pStyle.c2a;
					this.style.c3a = pStyle.c3a;
					this.style.c4a = pStyle.c4a;
				} else {
					arg = arg.slice(2,-1); // remove 'H' and '&'s
					var a = 1 - (parseInt(arg,16) / 255);
					this.style.c1a = a; // primary fill
					this.style.c2a = a; // secondary fill (for karaoke)
					this.style.c3a = a; // border
					this.style.c4a = a; // shadow
				}
			},
			"1a" : function(arg) {
				this.style.c1a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
			},
			"2a" : function(arg) {
				this.style.c2a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
			},
			"3a" : function(arg) {
				this.style.c3a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
			},
			"4a" : function(arg) {
				this.style.c4a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
			},
			"a" : function() {
				// This is handled in the SubtitleLine contructor.
			},
			"an" : function() {
				// This is handled in the SubtitleLine contructor.
			},
			"be" : function(arg) {
				// be == blur edges
				this.style.BE = overrideParse.be(arg);
			},
			"blur" : function(arg) {
				this.style.Blur = overrideParse.blur(arg);
			},
			"bord" : function(arg) {
				this.style.Outline = parseFloat(arg);
			},
			"xbord" : function(arg) {
				// TODO - Actually implement this properly somehow.
				let val = parseFloat(arg);
				if (Math.abs(val) < Math.abs(this.style.Outline))
					this.style.Outline = val;
			},
			"ybord" : function(arg) {
				// TODO - Actually implement this properly somehow.
				let val = parseFloat(arg);
				if (Math.abs(val) < Math.abs(this.style.Outline))
					this.style.Outline = val;
			},
			"c" : function(arg) {
				map["1c"].call(this,arg);
			},
			"1c" : function(arg) {
				var dummy;
				[dummy, this.style.c1r, this.style.c1g, this.style.c1b] = colorToARGB(arg);
			},
			"2c" : function(arg) {
				var dummy;
				[dummy, this.style.c2r, this.style.c2g, this.style.c2b] = colorToARGB(arg);
			},
			"3c" : function(arg) {
				var dummy;
				[dummy, this.style.c3r, this.style.c3g, this.style.c3b] = colorToARGB(arg);
			},
			"4c" : function(arg) {
				var dummy;
				[dummy, this.style.c4r, this.style.c4g, this.style.c4b] = colorToARGB(arg);
			},
			"clip" : function(arg) {
				if (!arg) return;

				arg = arg.split(",");
				if (this.clip) SC.getElementById("clip" + this.clip.num).remove();

				// Calculate Path
				let pathCode;
				if (arg.length == 4)
					pathCode = `M ${arg[0]} ${arg[1]} L ${arg[2]} ${arg[1]} ${arg[2]} ${arg[3]} ${arg[0]} ${arg[3]}`;
				else if (arg.length == 2)
					pathCode = pathASStoSVG(arg[1], parseFloat(arg[0])).path;
				else
					pathCode = pathASStoSVG(arg[0], 1).path;

				let id = getID();

				// Create Elements
				let path = createSVGElement("path");
					path.setAttribute("d",pathCode);
				let mask = createSVGElement("mask");
					mask.id = "clip" + id;
					mask.setAttribute("maskUnits","userSpaceOnUse");
					mask.appendChild(path);

				SC.getElementsByTagName("defs")[0].appendChild(mask);

				this.clip = {"type" : "mask", "num" : id};
			},
			"iclip" : function(arg) {
				if (!arg) return;

				arg = arg.split(",");
				if (this.clip) SC.getElementById("clip" + this.clip.num).remove();

				// Calculate Path
				let pathCode;
				if (arg.length == 4)
					pathCode = `M ${arg[0]} ${arg[1]} L ${arg[2]} ${arg[1]} ${arg[2]} ${arg[3]} ${arg[0]} ${arg[3]}`;
				else if (arg.length == 2)
					pathCode = pathASStoSVG(arg[1], parseFloat(arg[0])).path;
				else
					pathCode = pathASStoSVG(arg[0], 1).path;

				let id = getID();

				// Create Elements
				let path = createSVGElement("path");
					path.setAttribute("d",pathCode);
				let clipPath = createSVGElement("clipPath");
					clipPath.id = "clip" + id;
					clipPath.appendChild(path);

				SC.getElementsByTagName("defs")[0].appendChild(clipPath);

				this.clip = {"type" : "clip-path", "num" : id};
			},
			"fad" : function(arg) {
				let [fin,fout] = arg.split(",").map(parseFloat);
				let time = this.line.time.milliseconds;
				this.line.addFade(255,0,255,0,fin,time-fout,time);
			},
			"fade" : function(arg) {
				this.line.addFade(...arg.split(",").map(parseFloat));
			},
			"fax" : function(arg) {
				this.transforms.fax = Math.tanh(arg);
			},
			"fay" : function(arg) {
				this.transforms.fay = Math.tanh(arg);
			},
			"fn" : function(arg,data) {
				// If the arg starts and ends with parentheses, assume they're not part of the name.
				let name = isParenthesized(arg) ? arg.slice(1,-1).trim() : arg;
				this.style.Fontname = name;
				data.style["font-family"] = name;
				data.style["font-size"] = getFontMetrics(name,this.style.Fontsize).size + "px";
				this.cachedBBox.width = this.cachedBBox.width && NaN;
				this.cachedBBox.height = NaN;
			},
			"fr" : function(arg) {
				map["frz"].call(this,arg);
			},
			"frx" : function(arg) {
				this.transforms.frx = parseFloat(arg);
			},
			"fry" : function(arg) {
				this.transforms.fry = parseFloat(arg);
			},
			"frz" : function(arg) {
				this.transforms.frz = -(this.style.Angle + parseFloat(arg));
			},
			"fs" : function(arg,data) {
				let size = overrideParse.fs.call(this,arg);
				this.style.Fontsize = size;
				data.style["font-size"] = getFontMetrics(this.style.Fontname,size).size + "px";
				this.cachedBBox.width = this.cachedBBox.width && NaN;
				this.cachedBBox.height = NaN;
			},
			"fsc" : function(arg) {
				map.fscx.call(this,arg);
				map.fscy.call(this,arg);
			},
			"fscx" : function(arg) {
				let scale = overrideParse.fscx.call(this,arg);
				this.style.ScaleX = scale;
				this.transforms.fscx = scale / 100;
			},
			"fscy" : function(arg) {
				let scale = overrideParse.fscy.call(this,arg);
				this.style.ScaleY = scale;
				this.transforms.fscy = scale / 100;
			},
			"fsp" : function(arg) {
				this.style.Spacing = overrideParse.fsp.call(this,arg);
				this.cachedBBox.width = this.cachedBBox.width && NaN;
			},
			"k" : function(arg,data) {
				setKaraokeColors.call(this,arg,data,"k");
			},
			"K" : function(arg,data) {
				map["kf"].call(this,arg,data);
			},
			"kf" : function(arg,data) {
				let id = getID();

				// create gradient elements
				let startNode = createSVGElement("stop");
					startNode.setAttribute("offset",0);
					startNode.setAttribute("stop-color", `rgba(${this.style.c1r},${this.style.c1g},${this.style.c1b},${this.style.c1a})`);
				let endNode = createSVGElement("stop");
					endNode.setAttribute("stop-color", `rgba(${this.style.c2r},${this.style.c2g},${this.style.c2b},${this.style.c2a})`);
				let grad = createSVGElement("linearGradient");
					grad.appendChild(startNode);
					grad.appendChild(endNode);
					grad.id = "gradient" + id;
				SC.getElementsByTagName("defs")[0].appendChild(grad);

				data.style.fill = `url(#${grad.id})`;

				let ktLen = this.karaokeTransitions.length;
				if (ktLen) {
					// remove the previous \k or \ko transition
					let last = this.karaokeTransitions[ktLen-1];
					data.classes = data.classes.filter(str => !str.endsWith(last));
				}

				if (this.kf.length) {
					// remove the previous \kf transition
					let last = this.kf[this.kf.length-1];
					data.classes = data.classes.filter(str => !str.endsWith(last.num));
				}
				data.classes.push("kf"+id);

				let vars = {
					"startTime" : this.karaokeTimer,
					"endTime" : this.karaokeTimer + arg * 10,
					"num" : id
				};
				this.kf.push(vars);

				this.karaokeTimer = vars.endTime;
			},
			"ko" : function(arg,data) {
				setKaraokeColors.call(this,arg,data,"ko");
			},
			"kt" : function(arg) {
				this.karaokeTimer += arg * 10;
			},
			"_k" : function(arg,data) {
				let color = this.kko[arg];
				if (color.type == "ko") this.style.c3a = color.o;
				else {
					data.style.fill = `rgba(${color.r},${color.g},${color.b},${color.a})`;
					this.style.c1r = color.r;
					this.style.c1g = color.g;
					this.style.c1b = color.b;
					this.style.c1a = color.a;
				}
			},
			"move" : function(arg) {
				this.line.addMove(...arg.split(",").map(parseFloat));
			},
			"org" : function(arg) {
				// This is handled in the SubtitleLine contructor.
			},
			"p" : function(arg,data) {
				data.pathVal = parseFloat(arg);
			},
			"pbo" : function(arg) {
				this.pathOffset = parseInt(arg,10);
			},
			"pos" : function(arg) {
				let [x,y] = overrideParse.pos(arg);
				this.line.position = {x,y};
			},
			"q" : function() {
				// This is handled in the SubtitleLine contructor.
			},
			"r" : function(arg,data) {
				let styleName, style;

				// If there is an argument, use it if it's a valid style name.
				if (arg) {
					styleName = arg;
					style = renderer.styles[styleName];

					// If the arg wasn't a valid style name but it's parenthesized,
					// remove the parentheses and try again.
					if (!style && isParenthesized(arg)) {
						styleName = arg.slice(1,-1).trim();
						style = renderer.styles[styleName];
					}
				} else {
					// If there wasn't an argument given, reset the
					// style to the lines' initial style.
					styleName = this.line.data.Style;
					style = renderer.styles[styleName];
				}

				// If none of the previous styles were valid, use the default style.
				if (!style) {
					styleName = "Default";
					style = renderer.styles.Default;
				}

				data.classes.push(styleNameToClassName(styleName));
				this.style = JSON.parse(JSON.stringify(style));
				this.transitions.length = 0;

				this.cachedBBox.width = this.cachedBBox.width && NaN;
				this.cachedBBox.height = NaN;
			},
			"shad" : function(arg) {
				this.style.ShOffX = parseFloat(arg);
				this.style.ShOffY = parseFloat(arg);
			},
			"xshad" : function(arg) {
				this.style.ShOffX = parseFloat(arg);
			},
			"yshad" : function(arg) {
				this.style.ShOffY = parseFloat(arg);
			},
			"t" : function(arg,data) {
				if (!arg) return;

				// Split Arguments
				let first_slash = arg.indexOf("\\");
				let times = arg.slice(0,first_slash-1).split(",").map(parseFloat);
				let overrides = arg.slice(first_slash);

				// Parse Timing Arguments
				let intime, outtime, accel = 1;
				switch (times.length) {
					case 3:
						accel = times[2];
					case 2:
						outtime = times[1];
						intime = times[0];
						break;
					case 1:
						if (times[0]) accel = times[0];
						outtime = this.line.time.milliseconds;
						intime = 0;
				}

				// Handle \pos() Transitions
				overrides = overrides.replace(/\\pos[^\\]+/g, (M,arg) => {
					let [x,y] = overrideParse.pos(arg);
					this.line.addMove(this.line.position.x,this.line.position.y,x,y,intime,outtime,accel);
					return "";
				});

				// Handle \be, \blur, \fs, \fsc, \fscx, \fscy, and \fsp Transitions
				// First split \fsc into \fscx and \fscy so we don't have to write extra logic for it anywhere else.
				overrides = overrides.replace(/\\fsc([^xy][^\\]*)/g, (M,arg) => `\\fscx${arg}\\fscy${arg}`);
				overrides = overrides.replace(/\\(be|blur|fs(?:c[xy]|p)?)([^\\]*)/g, (M,type,arg) => {
					if (type == "be" || type == "blur")
						data.filterTransition = true;
					this.addInterpolatedUpdate(type, intime, outtime, overrideParse[type].call(this,arg), accel);
					return "";
				});

				// Handle Other Transitions
				if (overrides) {
					// Add Transition CSS Class (so the elements can be found later)
					let id = getID();
					data.classes.push("transition" + id);

					let newTransition = {
						"time" : intime,
						"data" : JSON.parse(JSON.stringify(data)), // make a copy of the current values
						"duration" : outtime - intime,
						"overrides" : overrides,
						"accel" : accel,
						"id" : id
					};

					// Insert Transitions Sorted by Start Time
					let index = this.transitions.findIndex(t => t.time > intime);
					if (index == -1)
						this.transitions.push(newTransition);
					else
						this.transitions.splice(index,0,newTransition);
				}
			},
			"te" : function() {
				// Transition End Flag
			}
		};
		function setKaraokeColors(arg,data,type) { // for \k and \ko
			// The ID we actually want is the one created in the call to map.t later.
			let id = getID() + 1;

			// karaoke type
			data.karaokeType = type;

			// color to transition to
			this.kko[id] = {
				"type" : type,
				"r" : this.style.c1r,
				"g" : this.style.c1g,
				"b" : this.style.c1b,
				"a" : this.style.c1a,
				"o" : this.style.c3a
			};

			if (this.kf.length) {
				// remove the previous \kf transition
				let last = this.kf[this.kf.length-1];
				data.classes = data.classes.filter(str => !str.endsWith(last.num));
			}

			let ktLen = this.karaokeTransitions.length;
			if (ktLen) {
				// remove the previous \k or \ko transition
				let last = this.karaokeTransitions[ktLen-1];
				data.classes = data.classes.filter(str => !str.endsWith(last));
			}
			this.karaokeTransitions.push(id);

			map.t.call(this, `${this.karaokeTimer},${this.karaokeTimer}\\_k${id}`, data);
			this.karaokeTimer += arg * 10;
		}

		let compiled_trie = generate_compiled_trie(Object.keys(map));

		function timeConvert(HMS) {
			var t = HMS.split(":");
			return t[0]*3600 + t[1]*60 + parseFloat(t[2]);
		}
		function pathASStoSVG(path,scale) {
			// This function converts an ASS style path to a SVG style path.

			// Check if this path has already been converted.
			let pathID = scale + path;
			if (pathID in computedPaths !== false)
				return computedPaths[pathID];

			path = path.toLowerCase();
			path = path.replace(/b/g,"C");   // cubic bézier curve to point 3 using point 1 and 2 as the control points
			path = path.replace(/l/g,"L");   // line-to <x>, <y>
			path = path.replace(/m/g,"Z M"); // move-to <x>, <y> (closing the shape first)
			path = path.replace(/n/g,"M");   // move-to <x>, <y> (without closing the shape)

			// extend b-spline to <x>, <y>
			// The "p" command is only supposed to be used after an "s" command,
			// but since the "s" command can actually take any number of points,
			// we can just remove all "p" commands and nothing will change.
			// In the same manner, an "s" command that immediately follows
			// another "s" command can also be removed.
			path = path.replace(/p/g,"");
			let changes = true;
			while (changes) {
				changes = false;
				path = path.replace(/s([\d\s.-]*)s/g, (M,points) => {
					changes = true;
					return "s" + points;
				});
			}

			// close b-spline
			// Since these are at least third degree b-splines, this can be
			// done by copying the starting location and the first two points
			// to the end of the spline.
			// before: x0 y0 s x1 y1 x2 y2 ... c
			// after:  x0 y0 s x1 y1 x2 y2 ... x0 y0 x1 y1 x2 y2
			changes = true;
			while (changes) {
				changes = false;
				path = path.replace(/(-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*)s((?:\s*-?\d+(?:\.\d+)?){4})([\d\s.-]*)c/g, (M,xy0,xy12,rest) => {
					changes = true;
					return xy0 + "s" + xy12 + rest + " " + xy0 + " " + xy12;
				});
			}

			// 3rd degree uniform b-spline
			// SVG doesn't have this, so we have convert them to a series of
			// Bézier curves.
			//   x0 y0 s x1 y1 x2 y2 x3 y3 x4 y4 x5 y5
			//   |-----------------------| Bézier 1
			//           |---------------------| Bézier 2
			//                 |---------------------| Bézier 3
			// Since the start point for a Bézier is different from a spline,
			// we also need to add a move before the first Bézier and after the
			// last Bézier. However, the bounding box of b-splines is different
			// from that of an equivalent Bézier curve, so we also have to keep
			// track of the extents of the spline.
			let extents;
			function basisToBézier(p) {
				// The input points should be in the same order as this.
				return [
					/* x0 */ (p[0] + 4 * p[2] + p[4]) / 6,
					/* y0 */ (p[1] + 4 * p[3] + p[5]) / 6,
					/* x1 */ (4 * p[2] + 2 * p[4]) / 6,
					/* y1 */ (4 * p[3] + 2 * p[5]) / 6,
					/* x2 */ (2 * p[2] + 4 * p[4]) / 6,
					/* y2 */ (2 * p[3] + 4 * p[5]) / 6,
					/* x3 */ (p[2] + 4 * p[4] + p[6]) / 6,
					/* y3 */ (p[3] + 4 * p[5] + p[7]) / 6
				];
			}
			changes = true;
			while (changes) {
				changes = false;
				path = path.replace(/(-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*)s((?:\s*-?\d+(?:\.\d+)?)+)/g, (M,start,rest) => {
					changes = true;

					let points = (start + " " + rest).split(/\s+/).map(parseFloat);

					// Calculate the "extents" of this spline. The path may be larger than this, but it will not be smaller.
					if (!extents) {
						extents = {
							"left": points[0],
							"top": points[1],
							"right": points[0],
							"bottom": points[1]
						};
					}
					for (let i = 0; i < points.length; i += 2) {
						extents.left = Math.min(extents.left, points[i]);
						extents.top = Math.min(extents.top, points[i+1]);
						extents.right = Math.max(extents.right, points[i]);
						extents.bottom = Math.max(extents.bottom, points[i+1]);
					}

					// Convert the b-spline to a series of Bézier curves.
					let replacement = "";
					for (let i = 0; i < points.length - 6; i += 2) {
						let bez_pts = basisToBézier(points.slice(i,i+8));
						let bez_str = " C " + bez_pts.slice(2).join(" ");
						replacement += replacement ? bez_str : `M ${bez_pts[0]} ${bez_pts[1]}${bez_str}`;
					}

					// The start and end points need to stay the same, with the replacement Bézier curves in between.
					return `${points[0]} ${points[1]} ${replacement} M ${points[points.length-2]} ${points[points.length-1]}`;
				});
			}

			// remove redundant "Z"s at the start and spaces in the middle
			path = path.replace(/^(?:\s*Z\s*)*/,"").replace(/\s+/g," ");

			// scale path
			if (scale != 1) {
				scale = 1 << (scale - 1);
				path = path.replace(/-?\d+(?:\.\d+)?/g, M => parseFloat(M) / scale);
				if (extents) {
					extents.top *= scale;
					extents.left *= scale;
					extents.bottom *= scale;
					extents.right *= scale;
				}
			}

			// Close the path at the end, save it to the cache, and return the data.
			return computedPaths[pathID] = {"path": path + " Z", "extents": extents};
		}
		function getFontMetrics(font,size) {
			size = (+size).toFixed(2);

			if (!fontMetrics[font]) {
				fontMetrics[font] = {};
				let cssFontNameValue = "0 \"" + font.replace(/"/g,"\\\"") + "\"";
				if (document.fonts && !document.fonts.check(cssFontNameValue)) {
					document.fonts.load(cssFontNameValue).then(() => {
						fontMetrics[font] = {};
						write_styles(renderer.styles);
					});
				}
			}

			if (!fontMetrics[font][size]) {
				let sampleText = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
				let smallE = createSVGElement("text");
					smallE.style.display = "block";
					smallE.style.fontFamily = font;
					smallE.style.fontSize = 100 + "px";
					smallE.style.opacity = 0;
					smallE.textContent = sampleText;
				let bigE = createSVGElement("text");
					bigE.style.display = "block";
					bigE.style.fontFamily = font;
					bigE.style.fontSize = 300 + "px";
					bigE.style.opacity = 0;
					bigE.textContent = sampleText;

				SC.appendChild(smallE);
				SC.appendChild(bigE);
				let scale = (200 / (bigE.getBBox().height - smallE.getBBox().height));
				smallE.remove();
				bigE.remove();

				let scaled = size * (scale >= 1 ? 1 / scale : scale);

				let finalE = createSVGElement("text");
					finalE.style.display = "block";
					finalE.style.dominantBaseline = "unset";
					finalE.style.fontFamily = font;
					finalE.style.fontSize = scaled + "px";
					finalE.style.opacity = 0;
					finalE.textContent = sampleText;
				SC.appendChild(finalE);
				let box = finalE.getBBox();

				let i = 10, diff = box.height - size;
				while (i --> 0 && Math.abs(diff) > 0.1) {
					scaled -= diff / 2;
					finalE.style.fontSize = scaled + "px";
					box = finalE.getBBox();
					diff = box.height - size;
				}

				finalE.fontStyle = "italic";
				let ibox = finalE.getBBox();

				finalE.remove();

				fontMetrics[font][size] = {
					"size": scaled,
					"height": box.height,
					"iheight": ibox.height,
					"descent": box.y + box.height,
					"idescent": ibox.y + ibox.height
				};
			}

			return fontMetrics[font][size];
		}

		function timeOverlap(T1,T2) {
			return (T1.start <= T2.start && T2.start < T1.end) || (T1.start < T2.end && T2.end <= T1.end);
		}
		function boundsOverlap(B1,B2) {
			return B1.left < B2.right && B1.right > B2.left && B1.top < B2.bottom && B1.bottom > B2.top;
		}
		function checkCollisions(line) {
			if (state != STATES.INITIALIZED || line.state != STATES.INITIALIZED || line.collisionsChecked)
				return;

			// So we don't do this again.
			line.collisionsChecked = true;

			// This function checks if the given line might collide with any
			// others. It doesn't check bounding boxes, so it might not.

			/* Lines do not collide if:
				They use \t(), \pos(), \mov(), or \move().
				They are not on the same alignment "level".
					-> top (789), middle (456), bottom (123)
					libass tries, but messes it up if this happens. "top" lines
					are pushed down, but "middle" and "bottom" lines are pushed
					up. Because of this I've put "top" lines in the "upper"
					group, and "middle" and "bottom" lines in the "lower" group.
					There's really not much we could actually do about it if
					"upper" and "lower" subtitles collided, so I've decided to
					just ignore those collisions to improve performance.
				They are not on the same layer.
				They do not occur at the same time.
			*/

			// Check for \t(), \pos(), \mov(), and \move().
			if (/{[^}]*\\(?:t(?!e)|pos|move?)[^}]*}/.test(line.data.Text))
				return;

			// Get the alignment group that this line belongs to.
			let A = line.style.Alignment;
			let alignmentGroup = (A > 6) ? collisions.upper : collisions.lower;

			// Get the layer group that this line belongs to.
			if (line.data.Layer in alignmentGroup === false)
				alignmentGroup[line.data.Layer] = [];
			let layerGroup = alignmentGroup[line.data.Layer];

			// Check if this line collides with any we've already seen.
			let toAdd = [], checked = new Set();
			if (reverseCollisions) {
				for (let collision of layerGroup) {
					if (checked.has(collision[1])) continue;
					if (timeOverlap(collision[1].time,line.time)) {
						if (collision[0])
							toAdd.unshift([line,collision[1]]);
						else
							collision[0] = line;
					}
					checked.add(collision[1]);
				}
				alignmentGroup[line.data.Layer] = [[null,line]].concat(toAdd,layerGroup);
			} else {
				for (let collision of layerGroup) {
					if (checked.has(collision[0])) continue;
					if (timeOverlap(collision[0].time,line.time)) {
						if (collision[1])
							toAdd.push([collision[0],line]);
						else
							collision[1] = line;
					}
					checked.add(collision[0]);
				}
				alignmentGroup[line.data.Layer] = layerGroup.concat(toAdd,[[line,null]]);
			}
		}

		function removeContainerScaling() {
			let ret = {
				"width" : SC.style.width,
				"height" : SC.style.height
			};
			SC.style.width = "";
			SC.style.height = "";
			return ret;
		}
		function reApplyContainerScaling(scaling) {
			SC.style.width = scaling.width;
			SC.style.height = scaling.height;
		}


		// The SubtitleLine "Class"
		let NewSubtitleLine = (function() {
			// The overrides that can change the line width are: \b, \i, \fn, \fs, \fsc, \fscx, \fsp, and \r.
			// This function checks for one of these overrides inside a transition inside a block.
			function hasWidthChangingBlock(text) {
				let reBlock = /{[^}]*}/g, match;
				while ((match = reBlock.exec(text)) !== null)
					/\\t[^\\]*(?:\\[^t][^\\]*)*?\\(?:b|i|f(?:n|s(?:cx?|p)?)|r)/g.test(match[0]);
			}
			function isPath(text) {
				// Note: This takes a string, not a LinePiece.
				let lip = text.lastIndexOf("\\p");
				return lip != -1 && text.charCodeAt(lip+2) != 48; // 48 == "0"
			}

			function shatterLine(pieces) {
				let newPieces = [];
				for (let piece of pieces) {
					// convert text
					//   from "{overide1}some text here{overridde2}more text ..."
					//     to [["override1",["some"," ","text"," ","here"]], ["override2",["more"," ","text"]], ...]
					// taking care not to split on non-breaking spaces or paths
					let data = piece.text.split("{").slice(1).map(a => a.split("}")).map(b => [b[0], isPath(b[0]) ? [b[1]] : b[1].split(/([^\S\xA0]+)/g)]);

					let megablock = "{";
					for (let [overrides,textarry] of data) {
						megablock += overrides;
						for (let text of textarry) {
							if (!text) continue; // skip empty lines created by path handling
							// the pieces will have to be renumbered later
							newPieces.push(NewLinePiece(piece.line, megablock + "}" + text, 999));
						}
					}
				}

				newPieces.shattered = true;
				return newPieces;
			}
			function wrapLine(line,wrap_style,max_line_width) {
				// Line pieces may be split at points that shouldn't wrap, so
				// we need to join them back together into chunks so we can
				// wrap on the chunks instead of the pieces.
				let chunks = [], widths = [], whitespaces = [];
				let chunk = [], width = 0, isWhitespace = false;
				for (let piece of line) {
					// Paths are always on their own, so split them out first.
					if (isPath(piece.text)) {
						if (chunk.length != 0) {
							chunks.push(chunk);
							widths.push(width);
							whitespaces.push(isWhitespace);
							chunk = [];
						}
						chunks.push([piece]);
						widths.push(piece.width());
						whitespaces.push(false);
						continue;
					}

					// If there is nothing in the chunk, add the current piece.
					if (chunk.length == 0) {
						chunk.push(piece);
						width = piece.width();
						isWhitespace = piece.isWhitespace();
						continue;
					}

					// Whitespace pieces can only be chunked with other whitespace pieces.
					if (isWhitespace) {
						if (piece.isWhitespace()) {
							chunk.push(piece);
							width += piece.width();
						} else {
							chunks.push(chunk);
							widths.push(width);
							whitespaces.push(true);
							chunk = [piece];
							width = piece.width();
							isWhitespace = false;
						}
						continue;
					}

					// Pieces with text can only be chunked with other text pieces.
					if (piece.isWhitespace()) {
						chunks.push(chunk);
						widths.push(width);
						whitespaces.push(false);
						chunk = [piece];
						width = piece.width();
						isWhitespace = true;
					} else {
						chunk.push(piece);
						width += piece.width();
					}
				}
				// Add anything left.
				if (chunk.length != 0) {
					chunks.push(chunk);
					widths.push(width);
					whitespaces.push(isWhitespace);
				}

				let num_chunks = chunks.length;
				let new_lines = [];

				// Whitespace pieces that end up at the start or
				// end of a line will not be included in the result.
				switch (wrap_style) {
					// Equal length lines with the top line longer than the bottom.
					case 0: {
						let slice = {start:0,end:0,width:0};
						let slices = [];

						// Create slices as big as possible starting from the front.
						// Whitespace is not included here.
						for (let i = 0; i < num_chunks; ++i) {
							// Skip whitespace at the start.
							if (slice.width == 0 && whitespaces[i]) {
								++slice.start;
								++slice.end;
							} else if (slice.width + widths[i] <= max_line_width) {
								++slice.end;
								slice.width += widths[i];
							} else {
								if (slice.width == 0) {
									++slice.end;
									slice.width = widths[i];
									slices.push(slice);
									slice = {start: slice.end, end: slice.end, width: 0};
								} else {
									// Remove whitespace at the end.
									while (whitespaces[slice.end-1]) {
										--slice.end;
										slice.width -= widths[slice.end];
									}

									slices.push(slice);

									let new_end = i + 1;
									if (whitespaces[i])
										slice = {start: new_end, end: new_end, width: 0};
									else
										slice = {start: i, end: new_end, width: widths[i]};
								}
							}
						}
						if (slice.width) slices.push(slice);

						// Bubble pieces down through the slices while keeping the constraints:
						//   don't make a line shorter than the one after it
						//   don't include whitespace at the start or end
						let bubbled, last_slice = slices.length - 1;
						do {
							bubbled = false;
							for (let i = last_slice; i > 0; --i) {
								let curr = slices[i], prev = slices[i-1];

								/*      prev      curr
								    |----------|  |--|   Before
									XXXXXXXX  XX  XXXX
									|------|  |------|   After
									  prev      curr
								*/
								while (true) {
									// Find the next non-whitespace piece
									// before the previous slice's end.
									let new_prev_end = prev.end;
									let new_prev_width = prev.width;
									do {
										--new_prev_end;
										new_prev_width -= widths[new_prev_end];
									} while (whitespaces[new_prev_end-1] && new_prev_end >= prev.start);

									// Get the width of everything between prev and curr,
									// including the last piece of prev.
									let new_curr_width = curr.width;
									for (let j = curr.start - 1; j >= prev.end - 1; --j)
										new_curr_width += widths[j];

									if (new_curr_width <= max_line_width && new_curr_width <= new_prev_width) {
										curr.start = prev.end - 1;
										curr.width = new_curr_width;
										prev.end = new_prev_end;
										prev.width = new_prev_width;
										bubbled = true;
									} else break;
								}
							}
						} while (bubbled);

						// Convert slice objects to actual slices and add them as new lines.
						for (let slice of slices) {
							let pieces = [];
							pieces.shattered = true;
							for (let chunk of chunks.slice(slice.start,slice.end))
								for (let piece of chunk)
									pieces.push(piece);
							new_lines.push(pieces);
						}

						break;
					}

					// Tries to fit as much text on a line as possible with
					// overflow going to the next line(s).
					case 1: {
						let width = 0, pieces = [];
						pieces.shattered = true;

						for (let i = 0; i < num_chunks; ++i) {
							if (width + widths[i] <= max_line_width) {
								// Don't push whitespace to the start of a line.
								if (!(pieces.length == 0 && whitespaces[i])) {
									width += widths[i];
									for (let piece of chunks[i])
										pieces.push(piece);
								}
							} else {
								// If nothing is on this line it means this piece is too long,
								// so it has to go on a line by itself (it will overflow).
								if (pieces.length == 0) {
									// Skip it if it's whitespace.
									if (!whitespaces[i]) {
										for (let piece of chunks[i])
											pieces.push(piece);
										new_lines.push(pieces);
										pieces = [];
										pieces.shattered = true;
										width = 0;
									}
								} else {
									// Remove whitespace from the end of the line.
									for (let j = i - 1; whitespaces[j]; --j)
										pieces.pop();

									new_lines.push(pieces);

									pieces = [];
									pieces.shattered = true;
									if (!whitespaces[i]) {
										for (let piece of chunks[i])
											pieces.push(piece);
										width = widths[i];
									} else width = 0;
								}
							}
						}

						// Make sure to add anything left over.
						if (pieces.length)
							new_lines.push(pieces);

						break;
					}

					// Equal length lines with the bottom line longer than the top.
					case 3: {
						let slice = {start: num_chunks, end: num_chunks, width:0};
						let slices = [];

						// Create slices as big as possible starting from the end.
						// Whitespace is not included here.
						for (let i = num_chunks - 1; i >= 0; --i) {
							// Skip whitespace at the end.
							if (slice.width == 0 && whitespaces[i]) {
								--slice.start;
								--slice.end;
							} else if (slice.width + widths[i] <= max_line_width) {
								--slice.start;
								slice.width += widths[i];
							} else {
								if (slice.width == 0) {
									--slice.start;
									slice.width = widths[i];
									slices.unshift(slice);
									slice = {start: slice.start, end: slice.start, width: 0};
								} else {
									// Remove whitespace at the start.
									while (whitespaces[slice.start]) {
										slice.width -= widths[slice.start];
										++slice.start;
									}

									slices.unshift(slice);

									if (whitespaces[i])
										slice = {start: i, end: i, width: 0};
									else
										slice = {start: i, end: i + 1, width: widths[i]};
								}
							}
						}
						if (slice.width) slices.unshift(slice);

						// Bubble pieces up through the slices while keeping the constraints:
						//   don't make a line shorter than the one before it
						//   don't include whitespace at the start or end
						let bubbled, last_slice = slices.length - 1;
						do {
							bubbled = false;
							for (let i = 0; i < last_slice; ++i) {
								let curr = slices[i], next = slices[i+1];

								/*  curr      next
								    |--|  |----------|   Before
									XXXX  XX  XXXXXXXX
									|------|  |------|   After
									  curr      next
								*/
								while (true) {
									// Find the next non-whitespace piece
									// after the next slice's start.
									let new_next_start = next.start;
									let new_next_width = next.width;
									do {
										new_next_width -= widths[new_next_start];
										++new_next_start;
									} while (whitespaces[new_next_start] && new_next_start < next.end);

									// Get the width of everything between curr and next.
									let new_curr_width = curr.width;
									for (let j = curr.end; j <= next.start; ++j)
										new_curr_width += widths[j];

									if (new_curr_width <= max_line_width && new_curr_width <= new_next_width) {
										curr.end = next.start + 1;
										curr.width = new_curr_width;
										next.start = new_next_start;
										next.width = new_next_width;
										bubbled = true;
									} else break;
								}
							}
						} while (bubbled);

						// Convert slice objects to actual slices and add them as new lines.
						for (let slice of slices) {
							let pieces = [];
							pieces.shattered = true;
							for (let chunk of chunks.slice(slice.start,slice.end))
								for (let piece of chunk)
									pieces.push(piece);
							new_lines.push(pieces);
						}

						break;
					}
				}

				return new_lines;
			}

			// These functions are `call`ed from other functions.
			function parseTextLine(line) {
				this.karaokeTimer = 0;

				let toReturn = document.createDocumentFragment();

				let tspan_data = {"classes": [], "style": {}, "filterTransition": false, "karaokeType": "", "pathVal": 0};
				let match, overrideTextSplit = /(?:{([^}]*)})?([^{]*)/g;
				while ((match = overrideTextSplit.exec(line))[0]) {
					let [_,overrides,text] = match;

					// Parse the overrides, converting them to CSS attributes.
					if (overrides) overrideToCSS.call(this,overrides,tspan_data);

					if (tspan_data.pathVal) {
						// Convert ASS path to SVG path.
						let converted = pathASStoSVG(text,tspan_data.pathVal);

						let P = createSVGElement("path");
							P.setAttribute("d",converted.path);
							P.classList.add(...this.div.classList, ...tspan_data.classes);
							for (let s in tspan_data.style) P.style[s] = tspan_data.style[s];

						// SVG bounding boxes are not affected by transforms,
						// so we can get this here and it will never change.
						SC.appendChild(P);
						P.bbox = P.getBBox();
						P.remove();

						// Modify path bbox based on the extents (possibly) returned by `pathASStoSVG()`.
						if (converted.extents) {
							let e = converted.extents;

							e.left = Math.min(e.left, P.bbox.x);
							e.top = Math.min(e.top, P.bbox.y);
							e.right = Math.max(e.right, P.bbox.x + P.bbox.width);
							e.bottom = Math.max(e.bottom, P.bbox.y + P.bbox.height);

							P.bbox.x = e.left;
							P.bbox.y = e.top;
							P.bbox.width = e.right - e.left;
							P.bbox.height = e.bottom - e.top;
						}

						this.path = P;
					}

					this.updateShadows(tspan_data);

					let tspan = createSVGElement("tspan");
					if (tspan_data.classes.length) tspan.classList.add(...tspan_data.classes);
					for (let s in tspan_data.style) tspan.style[s] = tspan_data.style[s];
					if (!tspan_data.pathVal) tspan.textContent = text;
					toReturn.appendChild(tspan);
				}

				// Create filter if necessary.
				if (tspan_data.filterTransition || this.style.BE || this.style.Blur) {
					this.filter = createSVGElement("filter");
					this.filter.id = "filter" + getID();
					this.filter.setAttribute("x", "-" + renderer.width);
					this.filter.setAttribute("y", "-" + renderer.height);
					this.filter.setAttribute("width", renderer.width * 2);
					this.filter.setAttribute("height", renderer.height * 2);
				}

				return toReturn;
			}
			function overrideToCSS(override_block,tspan_data) {
				tspan_data.karaokeType = "";

				let match, overreg = /\\(t(?!e)[^\\]*(?:\\[^t][^\\]*)*|[^\\]*)/g;
				while (match = overreg.exec(override_block)) {
					let opt = match[1];
					let i = compiled_trie(opt);
					if (i) {
						let override = map[opt.slice(0,i)];
						override.call(this, opt.slice(i), tspan_data);
					}
				}

				let s = this.style;
				let stroke_alpha = tspan_data.karaokeType == "ko" ? 0 : s.c3a;

				// update colors
				if (!tspan_data.style.fill || (tspan_data.style.fill && !tspan_data.style.fill.startsWith("url("))) {
					if (tspan_data.karaokeType == "k")
						tspan_data.style.fill = `rgba(${s.c2r},${s.c2g},${s.c2b},${s.c2a})`;
					else
						tspan_data.style.fill = `rgba(${s.c1r},${s.c1g},${s.c1b},${s.c1a})`;
				}
				tspan_data.style.stroke = `rgba(${s.c3r},${s.c3g},${s.c3b},${stroke_alpha})`;
				tspan_data.style["stroke-width"] = s.Outline + "px";
			}

			function transition(t,time) {
				// If the line has stopped displaying before the transition starts.
				if (!this.div) return;

				let data = t.data;
				let duration = t.duration;
				let accel = t.accel;

				// copy some starting style values
				let SRS = {
					"fill": data.style.fill,
					"stroke": data.style.stroke,
					"stroke-width": data.style["stroke-width"]
				};

				// copy starting colors
				let startColors, endColors, updateGradients = this.kf.length && duration;
				if (updateGradients) {
					startColors = {
						primary: {
							r: this.style.c1r,
							g: this.style.c1g,
							b: this.style.c1b,
							a: this.style.c1a
						},
						secondary: {
							r: this.style.c2r,
							g: this.style.c2g,
							b: this.style.c2b,
							a: this.style.c2a
						},
						border: {
							r: this.style.c3r,
							g: this.style.c3g,
							b: this.style.c3b,
							a: this.style.c3a
						},
						shadow: {
							r: this.style.c4r,
							g: this.style.c4g,
							b: this.style.c4b,
							a: this.style.c4a
						}
					};
				}

				overrideToCSS.call(this,t.overrides,data);

				// check if the copied style values have changed
				let RSChanged = SRS.fill != data.style.fill || SRS.stroke != data.style.stroke || SRS["stroke-width"] != data.style["stroke-width"];

				// copy ending colors
				if (updateGradients) {
					endColors = {
						primary: {
							r: this.style.c1r,
							g: this.style.c1g,
							b: this.style.c1b,
							a: this.style.c1a
						},
						secondary: {
							r: this.style.c2r,
							g: this.style.c2g,
							b: this.style.c2b,
							a: this.style.c2a
						},
						border: {
							r: this.style.c3r,
							g: this.style.c3g,
							b: this.style.c3b,
							a: this.style.c3a
						},
						shadow: {
							r: this.style.c4r,
							g: this.style.c4g,
							b: this.style.c4b,
							a: this.style.c4a
						}
					};
				}


				let trans = "all " + duration + "ms ";

				// add transition timing function
				if (accel == 1) trans += "linear";
				else {
					let CBC = fitCurve([[0,0],[0.25,Math.pow(0.25,accel)],[0.5,Math.pow(0.5,accel)],[0.75,Math.pow(0.75,accel)],[1,1]]);
					// cubic-bezier(x1, y1, x2, y2)
					trans += "cubic-bezier(" + CBC[1][0] + "," + CBC[1][1] + "," + CBC[2][0] + "," + CBC[2][1] + ")";
				}

				// add transition delay
				trans += " " + (t.time - time) + "ms";


				// add transition to elements
				this.div.style.transition = trans; // for transitions that can only be applied to the entire line
				let divs = SC.getElementsByClassName("transition"+t.id);
				for (let div of divs) {
					div.style.transition = trans;
					for (let x in data.style)
						div.style[x] = data.style[x];
					div.classList.add(...data.classes);
				}
				if (this.box) this.box.style.transition = trans;

				// update \kf color gradients
				if (updateGradients) {
					let sameColor = (start,end) => (start.r == end.r && start.g == end.g && start.b == end.b && start.a == end.a);
					let pColorChanged = !sameColor(startColors.primary, endColors.primary);
					let sColorChanged = !sameColor(startColors.secondary, endColors.secondary);
					if (pColorChanged || sColorChanged) {
						let p1 = startColors.primary, s1 = startColors.secondary;
						let p2 = endColors.primary, s2 = endColors.secondary;
						let before = "<animate attributeName='stop-color' from='rgba(";
						let after = ")' dur='" + duration + "ms' fill='freeze' />";
						let anim1 = before + [p1.r, p1.g, p1.b, p1.a].join() + ")' to='rgba(" + [p2.r, p2.g, p2.b, p2.a].join() + after;
						let anim2 = before + [s1.r, s1.g, s1.b, s1.a].join() + ")' to='rgba(" + [s2.r, s2.g, s2.b, s2.a].join() + after;
						for (let vars of this.kf) {
							let stop = SC.getElementById("gradient" + vars.num).children;
							if (pColorChanged) stop[0].innerHTML = anim1;
							if (sColorChanged) stop[1].innerHTML = anim2;
						}
					}
				}

				if (RSChanged) this.updateShadows(data);

				// If this lines' wrap style is not 2 (no wrap), check that the
				// current overrides will not change the line width. If they do,
				// we will need to possible re-wrap the line. Otherwise we can
				// just update the position of this piece.
				if (this.line.style.WrapStyle != 2 && hasWidthChangingBlock("{\\t" + t.overrides + "}")) {
					this.line.positionUpdateRequired = true;
				} else this.positionUpdateRequired = true;
			}
			function clearTransitions(id) {
				let divs = SC.getElementsByClassName("transition"+id);
				if (this.div) this.div.style.transition = "";
				for (let div of divs) div.style.transition = "";
				if (this.box) this.box.style.transition = "";
			}


			// The LinePiece "Class"
			let NewLinePiece = (function() {
				function LinePiece(line,text,piece_num) {
					// Handle duplicate overrides and some \r effects.
					text = text.replace(/{[^}]*}/g, match => { // match = {...}
						// Remove all but the last instance of every override, not including transitions,
						// but including the overrides inside the transitions. Karaoke overrides are
						// merged together into two overrides: a \kt override and the last override.
						let ostr = "", overrides = match.slice(1,-1).split("\\").reverse().slice(0,-1);
						let to_skip = new Set(["a","an","org","q"]), seen = new Set();
						let in_transition = false, has_karaoke = false, kt_sum = 0;
						for (let override of overrides) {
							let i = compiled_trie(override);
							if (i) {
								let name = override.slice(0,i);

								// Fix multiple karaoke effects in one override by converting
								// all but the last one into a single \kt override.
								if (name.charAt(0) == "K" || name.charAt(0) == "k") {
									if (has_karaoke || name == "kt") {
										kt_sum += parseFloat(override.slice(i));
										continue;
									} else has_karaoke = true;
								} else {
									// If the override has already been parsed or we've
									// already seen it in this line it can be removed.
									if (to_skip.has(name) || seen.has(name)) continue;
								}

								// Add the override back to the text.
								ostr = "\\" + override + ostr;

								// Since we're parsing in reverse, \te starts a transition and \t ends it.
								// Overrides inside a transition should not be counted as having been seen.
								if (name == "t") in_transition = false;
								else if (name == "te") in_transition = true;
								else if (!in_transition) seen.add(name);
							}
						}
						match = "{" + (kt_sum ? "\\kt" + kt_sum : "") + ostr + "}";

						// If there's an \r override.
						if (seen.has("r")) {
							// Remove all style overrides before that \r override.
							// Style Overrides: \b, \i, \u, \s, \alpha, \1a, \2a, \3a, \4a, \be, \blur,
							// \bord, \xbord, \ybord \c, \1c, \2c, \3c, \4c, \fax, \fay, \fn, \fr,
							// \frx, \fry, \frz, \fs, \fsc, \fscx, \fscy, \fsp, \shad, \xshad, and \yshad
							let [before,after] = match.split("\\r");
							before = before.replace(/\\(?:[bius]|alpha|[1-4]a|be|blur|[xy]?bord|[1-4]?c|fa[xy]|fn|fr[xyz]?|fs(?:c[xy]?|p)?|[xy]?shad)[^\\]*/g, "");
							match = before + "\\r" + after;
						}

						// Remove any transitions that are now empty.
						match = match.replace(/\\t(?!e)[^\\]*(?:\\te|$)/g, "");

						return match;
					});

					this.line = line;
					this.text = text;
					this.pieceNum = piece_num;
					this.style = null;

					// These are used for lines that have been split, for handling
					// collisions, and for offsetting paths with \pbo.
					this.splitLineOffset = {x:0,y:0};
					this.pathOffset = 0; // vertical offset only

					this.cachedBBox = {width:NaN,height:NaN};
					this.cachedBounds = {
						top: 0,
						left: 0,
						bottom: 0,
						right: 0
					};

					this.filterUpdateRequired = false;
					this.positionUpdateRequired = false;

					this.group = null;
					this.box = null;
					this.div = null;
					this.path = null;
					this.filter = null;

					this.transitions = null;
					this.transforms = null;
					this.updates = null;

					// used by setKaraokeColors()
					this.kf = [];
					this.kko = {};
					this.karaokeTransitions = [];
					this.karaokeTimer = 0;

					this.clip = null; // used by \clip() and \iclip()
				}


				LinePiece.prototype.width = function() { return this.cachedBounds.right - this.cachedBounds.left; };
				LinePiece.prototype.height = function() { return this.cachedBounds.bottom - this.cachedBounds.top; };
				LinePiece.prototype.descent = function() {
					let TS = this.style, metrics = getFontMetrics(TS.Fontname,TS.Fontsize);
					return (TS.Italic ? metrics.idescent : metrics.descent) * this.transforms.fscy;
				};
				LinePiece.prototype.isWhitespace = function() { return /^[^\S\xA0]*$/.test(this.text.replace(/{[^}]*}/g,"")); };

				LinePiece.prototype.init = function() {
					let styleName = this.line.data.Style;
					this.style = JSON.parse(JSON.stringify(renderer.styles[styleName])); // deep clone

					this.div = createSVGElement("text");
					let TD = this.div;
						TD.classList.add(styleNameToClassName(styleName));

					// For Microsoft Edge
					if (window.CSS && CSS.supports && !CSS.supports("dominant-baseline","text-after-edge"))
						TD.setAttribute("dy","0.75em");

					let BorderStyle = rendererBorderStyle || this.style.BorderStyle;
					if (BorderStyle == 3 || (BorderStyle == 4 && this.pieceNum < 2))
						this.box = createSVGElement("rect");

					this.filterUpdateRequired = false;
					this.positionUpdateRequired = false;
					this.transitions = [];
					this.transforms = {"fax":0,"fay":0,"frx":0,"fry":0,"frz":0,"fscx":1,"fscy":1};
					this.updates = {"be":null,"blur":null,"fs":null,"fscx":null,"fscy":null,"fsp":null};

					let M = this.line.Margin;
					if (M.L) TD.style["margin-left"] = M.L + "px";
					if (M.R) TD.style["margin-right"] = M.R + "px";
					if (M.V) {
						TD.style["margin-top"] = M.V + "px";
						TD.style["margin-bottom"] = M.V + "px";
					}

					TD.appendChild(parseTextLine.call(this,this.text));

					this.group = createSVGElement("g");
					this.group.dataset.piece = this.pieceNum;
					this.group.appendChild(TD);
					this.group.line = this;

					if (this.path) this.group.insertBefore(this.path,TD);
					if (this.clip) this.group.setAttribute(this.clip.type,`url(#clip${this.clip.num})`);
					if (this.filter) {
						this.updateFilters();
						this.group.setAttribute("filter",`url(#${this.filter.id})`);
					}
				};
				LinePiece.prototype.update = function(time) {
					for (let u in this.updates)
						if (this.updates[u])
							this.executeInterpolatedUpdate(u,time);

					for (let i = 0; i < this.kf.length; ++i)
						this.updatekf(time,i);

					while (this.transitions.length && this.transitions[0].time <= time) {
						// Only one transition can be done each frame.
						let t = this.transitions.shift();
						transition.call(this,t,time);

						// Remove all those transitions so they don't affect anything else.
						// It wouldn't affect other transitions, but it could affect updates.
						// Changing the transition timing doesn't affect currently running
						// transitions, so this is okay to do. We do have to let the animation
						// actually start first though, so we can't do it immediately.
						if (t.time + t.duration < time) {
							addAnimationTask(clearTransitions.bind(this,t.id));
							break;
						}
					}

					if (this.filterUpdateRequired)
						this.updateFilters();
					if (this.positionUpdateRequired)
						this.updatePosition();
				};
				LinePiece.prototype.clean = function() {
					for (let vars of this.kf) SC.getElementById("gradient" + vars.num).remove();
					if (this.clip) SC.getElementById("clip" + this.clip.num).remove();
					this.clip = null;

					this.group = null;
					this.box = null;
					this.div = null;
					this.path = null;
					this.filter = null;

					this.transitions = null;
					this.transforms = null;
					this.updates = null;

					this.kf = [];
					this.kko = {};
					this.karaokeTransitions = [];
					this.karaokeTimer = 0;
				};

				LinePiece.prototype.addInterpolatedUpdate = function(type, start_time, end_time, end_value, accel) {
					let start_value;
					if (type == "be") start_value = this.style.BE;
					else if (type == "blur") start_value = this.style.Blur;
					else if (type == "fs") start_value = this.style.FontSize;
					else if (type == "fscx") start_value = this.style.ScaleX;
					else if (type == "fscy") start_value = this.style.ScaleY;
					else /* if (type == "fsp") */ start_value = this.style.Spacing;

					this.updates[type] = addInterpolatedTransition(this.updates[type], start_time, end_time, start_value, end_value, accel);
				}
				LinePiece.prototype.executeInterpolatedUpdate = function(type,time) {
					let new_value = calculateInterpolatedTransition(time,this.updates[type].points);

					switch (type) {
						case "be":
							this.style.BE = Math.round(new_value);
							break;
						case "blur":
							this.style.Blur = new_value;
							break;
						case "fs":
							map.fs.call(this, "" + new_value);
							break;
						case "fscx":
							this.style.ScaleX = new_value;
							this.transforms.fscx = new_value / 100;
							break;
						case "fscy":
							this.style.ScaleY = new_value;
							this.transforms.fscy = new_value / 100;
							break;
						case "fsp":
							this.style.Spacing = new_value;
							this.cachedBBox.width = this.cachedBBox.width && NaN;
					}

					if (type == "be" || type == "blur")
						this.filterUpdateRequired = true;
					else
						this.line.positionUpdateRequired = true;
				}

				LinePiece.prototype.updateShadows = function(tspan_data) {
					let DS = tspan_data.style;
					let TS = this.style;

					let borderColor = DS.stroke;
					let shadowColor = "rgba(" + TS.c4r + "," + TS.c4g + "," + TS.c4b + "," + TS.c4a + ")";

					let BorderStyle = rendererBorderStyle || TS.BorderStyle;
					if (BorderStyle == 3) { // Outline as Border Box
						let TBS = this.box.style;

						TBS.fill = borderColor;
						TBS.stroke = borderColor;
						TBS.strokeWidth = DS["stroke-width"];

						// Remove text border from lines that have a border box.
						DS["stroke-width"] = "0px";

						TBS.filter = "";
						if (TS.ShOffX != 0 || TS.ShOffY != 0) // \shad, \xshad, \yshad
							TBS.filter = "drop-shadow(" + TS.ShOffX + "px " + TS.ShOffY + "px 0 " + shadowColor + ")";
					} else if (BorderStyle == 4) { // Shadow as Border Box
						// Only the first piece in a splitline will have this element for border style 4.
						if (this.box) {
							let TBS = this.box.style;

							TBS.fill = shadowColor;
							TBS.stroke = shadowColor;
							TBS.strokeWidth = DS["stroke-width"];
							TBS.filter = "";
						}
					} else {
						this.div.style.filter = "";
						if (TS.ShOffX != 0 || TS.ShOffY != 0) // \shad, \xshad, \yshad
							this.div.style.filter += "drop-shadow(" + TS.ShOffX + "px " + TS.ShOffY + "px 0 " + shadowColor + ")";
					}

					if (this.path) {
						this.path.style.filter = "";
						if (TS.ShOffX != 0 || TS.ShOffY != 0) // \shad, \xshad, \yshad
							this.path.style.filter += "drop-shadow(" + TS.ShOffX + "px " + TS.ShOffY + "px 0 " + shadowColor + ")";
					}
				}
				LinePiece.prototype.updateFilters = function(time,index) {
					this.filterUpdateRequired = false;

					let TS = this.style, F = this.filter;

					// Clear any previous filters.
					// We need to have a dummy filter here so that it will contain
					// something even if nothing is currently happening.
					F.innerHTML = "<feOffset/>";

					// Don't blur if there's an outline. If there's an outline, only
					// the outline is supposed to be blurred, but I don't currently
					// know of an easy way to do that.
					// What we really need is proposal (7) from:
					// https://lists.w3.org/Archives/Public/www-svg/2012Dec/0059.html
					if (TS.Outline == 0 && (TS.BE || TS.Blur)) {
						// \blur is applied before \be
						if (TS.Blur) {
							let gb = createSVGElement("feGaussianBlur");
								gb.setAttribute("stdDeviation",TS.Blur/2);
							F.appendChild(gb);
						}
						if (TS.BE) {
							for (let i = 0; i < TS.BE; ++i) {
								let cm = createSVGElement("feConvolveMatrix");
									cm.setAttribute("order","3");
									cm.setAttribute("kernelMatrix","1 2 1 2 4 2 1 2 1");
								F.appendChild(cm);
							}
						}
					}
				};
				LinePiece.prototype.updatekf = function(time,index) {
					let vars = this.kf[index];

					if (!vars.start) {
						vars.node = SC.querySelector(".kf" + vars.num);
						if (!vars.node) {
							let last = this.kf.pop();
							if (last !== vars)
								this.kf[index] = last;
							return;
						}

						// Remove Container Scaling
						let scaling = removeContainerScaling();

						let range = document.createRange();
						range.selectNode(vars.node);
						let eSize = range.getBoundingClientRect();
						range.selectNodeContents(this.div);
						let pSize = range.getBoundingClientRect();

						// Re-apply Container Scaling
						reApplyContainerScaling(scaling);

						if (eSize.width == 0 || pSize.width == 0) return;

						vars.start = (eSize.left - pSize.left) / pSize.width;
						vars.frac = eSize.width / pSize.width;
						vars.gradStop = SC.getElementById("gradient" + vars.num).firstChild;
					}

					let val;
					if (time <= vars.startTime) val = vars.start;
					else if (vars.endTime <= time) val = vars.start + vars.frac;
					else val = vars.start + vars.frac * (time - vars.startTime) / (vars.endTime - vars.startTime);

					vars.node.style.fill = "url(#gradient" + vars.num + ")";
					vars.gradStop.setAttribute("offset", val);
				};
				LinePiece.prototype.updatePosition = function() {
					// The lines' updatePosition function calls this function,
					// so if it's been scheduled to run we don't need to do it here.
					if (this.line.positionUpdateRequired) return;
					this.positionUpdateRequired = false;

					// For positioning, imagine a box surrounding the paths and the text. That box is
					// positioned and transformed relative to the video, and the paths and text are
					// positioned relative to the box.

					let TS = this.style;
					let A = this.line.style.Alignment;
					let TD = this.div;
					let TT = this.transforms;

					if (TS.Angle && !TT.frz) TT.frz = -TS.Angle;

					// This is the position of the anchor.
					let position;
					if (this.line.position) {
						position = {x:this.line.position.x,y:this.line.position.y};
					} else {
						let M = this.line.Margin;
						let x, y;

						if (A%3 == 0) // 3, 6, 9
							x = renderer.width - M.R;
						else if ((A+1)%3 == 0) // 2, 5, 8
							x = M.L + (renderer.width - M.L - M.R) / 2;
						else // 1, 4, 7
							x = M.L;

						if (A > 6) // 7, 8, 9
							y = M.V;
						else if (A < 4) // 1, 2, 3
							y = renderer.height - M.V;
						else // 4, 5, 6
							y = renderer.height / 2;

						position = {x,y};
					}
					position.x += this.splitLineOffset.x;
					position.y += this.splitLineOffset.y + this.line.collisionOffset;

					// This is the actual div/path position.
					let tbox = this.cachedBBox, metrics = getFontMetrics(TS.Fontname,TS.Fontsize);
					if (isNaN(tbox.width)) {
						tbox.width = TD.getComputedTextLength();
						if (TS.Spacing)
							tbox.width += TD.textContent.length * TS.Spacing;
					}
					if (isNaN(tbox.height)) {
						tbox.height = TS.Italic ? metrics.iheight : metrics.height;
						// Lines that are just a newline are half size.
						if (tbox.width == 0 && !this.path)
							tbox.height /= 2;
					}
					let pbox = this.path ? this.path.bbox : {width:0,height:0};
					let bbox = {
						"width": tbox.width + pbox.width,
						"height": Math.max(tbox.height, pbox.height)
					};

					// Calculate anchor offset.
					let anchor = {x:0,y:0};
					if (A%3 != 1) {
						anchor.x = bbox.width; // 3, 6, 9
						if (A%3 == 2) // 2, 5, 8
							anchor.x /= 2;
					}
					if (A < 7) {
						// If there is no text, its height is ignored for the anchor offset.
						let height = tbox.width ? bbox.height : pbox.height;
						anchor.y = height; // 1, 2, 3
						if (A > 3) // 4, 5, 6
							anchor.y /= 2;
					}

					// If there is a path, the text needs to be shifted to make room.
					let shift = {x:0,y:0};
					if (this.path && tbox.width) {
						shift.x = pbox.width;
						if (pbox.height > tbox.height)
							shift.y = pbox.height - tbox.height;
					}

					// Transforms happen in reverse order.
					// The origin only affects rotations.
					let origin = this.line.rotation_origin || {x:0,y:0};
					let t = {
						toAnchor: `translate(${-anchor.x}px,${-anchor.y}px)`,	/* translate to anchor position */
						scale: `scale(${TT.fscx},${TT.fscy})`,
						toRotOrg: `translate(${-origin.x}px,${-origin.y}px)`,	/* move to rotation origin */
						rotate: `rotateZ(${TT.frz}deg) rotateY(${TT.fry}deg) rotateX(${TT.frx}deg)`,
						fromRotOrg: `translate(${origin.x}px,${origin.y}px)`,	/* move from rotation origin */
						skew: `skew(${TT.fax}rad,${TT.fay}rad)`,				/* aka shear */
						translate: `translate(${position.x}px,${position.y}px)`	/* translate to position */
					};

					let transforms = `${t.translate} ${t.skew} ${t.fromRotOrg} ${t.rotate} ${t.toRotOrg} ${t.scale} ${t.toAnchor}`;
					let textTransforms = (shift.x || shift.y) ? `${transforms} translate(${shift.x}px,${shift.y}px)` : transforms;

					// The main div is positioned using its x and y attributes so that it's
					// easier to debug where it is on screen when the browser highlights it.
					// This does mean we have to add an extra translation though.
					TD.style.transform = `${textTransforms} translate(${anchor.x - position.x}px,${anchor.y - position.y}px)`;
					TD.setAttribute("x", position.x - anchor.x);
					TD.setAttribute("y", position.y - anchor.y);
					if (TS.Spacing && tbox.width)
						TD.setAttribute("dx", "0" + ` ${TS.Spacing}`.repeat(TD.textContent.length - 1));
					if (this.box) {
						// This box is only behind the text; it does not go behind a path. The border
						// of the box straddles the bounding box, with half of it "inside" the box, and
						// half "outside". This means that we need to increase the size of the box by
						// one borders' breadth, and we need to offset the box by half that.
						let TB = this.box;
						let B = parseFloat(TB.style.strokeWidth);
						TB.style.transform = textTransforms;
						TB.setAttribute("x", -B / 2);
						TB.setAttribute("y", -B / 2);
						TB.setAttribute("width", tbox.width + B);
						TB.setAttribute("height", tbox.height + B);
					}
					if (this.path) {
						let textOffset = 0;
						if (A < 7 && tbox.width && tbox.height > pbox.height) {
							textOffset = tbox.height - pbox.height;
							if (A > 3) textOffset /= 2;
						}
						// `this.pathOffset` should probably be in here too, but it seems to give the wrong result.
						this.path.style.transform = `${transforms} translateY(${textOffset}px)`;
					}
					for (let vars of this.kf) SC.getElementById("gradient" + vars.num).setAttribute("gradient-transform", textTransforms);

					// Calculate the full bounding box after transforms. Rotations
					// are ignored because they're unnecessary for this purpose,
					// and they would make it more difficult to compare bounds.
					// https://code-industry.net/masterpdfeditor-help/transformation-matrix/
					function calc(x,y) {
						return {
							x: TT.fscx * x + Math.tan(TT.fay * Math.PI / 180) * y - anchor.x,
							y: Math.tan(TT.fax * Math.PI / 180) * x + TT.fscy * y - anchor.y
						};
					}
					let tl = calc(position.x, position.y);
					let br = calc(position.x + bbox.width, position.y + bbox.height);
					this.cachedBounds.top = tl.y;
					this.cachedBounds.left = tl.x;
					this.cachedBounds.bottom = br.y;
					this.cachedBounds.right = br.x;
				};


				return (line,text,piece_num) => new LinePiece(line,text,piece_num);
			})();


			function SubtitleLine(data,num) {
				this.data = data;
				this.num = num;
				this.lines = [];
				this._lines = this.lines; // used for automatic line breaks
				this.group = null;

				this.Margin = {"L" : (data.MarginL && parseInt(data.MarginL,10)) || renderer.styles[data.Style].MarginL,
							   "R" : (data.MarginR && parseInt(data.MarginR,10)) || renderer.styles[data.Style].MarginR,
							   "V" : (data.MarginV && parseInt(data.MarginV,10)) || renderer.styles[data.Style].MarginV};

				this.time = {"start" : timeConvert(data.Start), "end" : timeConvert(data.End)};
				this.time.milliseconds = (this.time.end - this.time.start) * 1000;

				this.state = STATES.UNINITIALIZED;
				this.visible = false;
				this.collisionOffset = 0; // vertical offset only
				this.collisionsChecked = false; // used by checkCollisions()

				this.position = null;
				this.rotation_origin = null;
				this.positionUpdateRequired = false; // if this.updatePosition() has been scheduled to run
				this.updates = null;


				// If the line's style isn't defined, set it to the default.
				if (data.Style in renderer.styles === false)
					data.Style = "Default";

				// The line only needs a few of the styles, not all of them.
				let style = renderer.styles[data.Style];
				this.style = {
					"Alignment": style.Alignment,
					"BorderStyle": style.BorderStyle,
					"Justify": style.Justify,
					"WrapStyle": renderer.WrapStyle
				};


				let text = data.Text;

				// Parse alignment and rotation origin overrides here because they apply to the
				// entire line and should only appear once, but if they appear more than once,
				// only the first instance counts.
				let alignment = /{[^}]*?\\(an?)(\d\d?)[^}]*}/.exec(text);
				if (alignment) {
					let val = parseInt(alignment[2],10);
					if (val)
						this.style.Alignment = (alignment[1] == "a" ? SSA_ALIGNMENT_MAP[val] : val);
				}
				let rot_org = /{[^}]*?\\org([^\\]+)[^}]*}/.exec(text);
				if (rot_org) {
					let [x,y] = rot_org[1].split(",").map(parseFloat);
					this.rotation_origin = {x,y};
				}

				// Check if there are line breaks, and replace soft breaks with spaces if they don't apply. Yes, the
				// ".*" in the second RegEx is deliberate. Since \q affects the entire line, there should only be one.
				// If there are more, the last one is applied.
				let hasLineBreaks = text.includes("\\N");
				let qWrap = text.match(/{[^}]*\\q[0-9][^}]*}/g);
				if (qWrap) this.style.WrapStyle = parseInt(/.*\\q([0-9])/.exec(qWrap[qWrap.length-1])[1],10);
				if (this.style.WrapStyle == 2) hasLineBreaks = hasLineBreaks || text.includes("\\n");
				else text = text.replace(/\\n/g," ");

				// Combine adjacent override blocks, adding a block to
				// the start in case there isn't one there already.
				text = combineAdjacentBlocks("{}" + text);

				data.Text = text;


				// Things that can change within a line, but isn't allowed to be changed within a line in HTML/CSS/SVG,
				// as well and things that can change the size of the text, and the start of paths and transitions.
				// Can't Change Within a Line: \fax, \fay, \fr, \frx, \fry, \frz, \fsc, \fscx, \fscy, \shad, \xshad, and \yshad
				// Affects Text Size: \b, \i, \fax, \fay, \fn, \fs, \fsc, \fscx, \fscy, \fsp, and \r
				let reProblem;
				if (!!window.chrome) // Also break on \K and \kf in Chromium.
					reProblem = /\\(?:i|b|be|blur|[xy]?bord|f(?:a[xy]|n|r[xyz]?|s(?:c[xy]?|p)?)|r|K|kf|[xy]?shad|p0*(?:\.0*)?[1-9]|t(?!e))/;
				else
					reProblem = /\\(?:i|b|be|blur|[xy]?bord|f(?:a[xy]|n|r[xyz]?|s(?:c[xy]?|p)?)|r|[xy]?shad|p0*(?:\.0*)?[1-9]|t(?!e))/;

				// Check for one of the problematic overrides after the first block.
				let hasProblematicOverride = data.Text.match(/{[^}]*}/g).slice(1).some(reProblem.test.bind(reProblem));


				if (hasLineBreaks || hasProblematicOverride) {
					// Merge subtitle line pieces into non-problematic strings. Each piece can still have more
					// than one block in it, but problematic blocks will start a new piece. For example, a block
					// that is scaled differently will start a piece and every other block in that piece must have
					// the same scale. If the scale changes again, it will start a new piece. This also ensures
					// that paths will always be at the start of a piece, simplifying size calculations. 'megablock'
					// is the concatenation of every previous override in the line. It is prepended to each new line
					// so that they don't lose any overrides that might affect them. Because of the complexities of
					// transitions, every block after a transition will have to be split on, even if it doesn't
					// itself contain a transition.
					let megablock = "{";
					for (let line of data.Text.split(/\\[Nn]/g)) {
						// Remove leading and trailing whitespace.
						let lastSeenText = '';
						line = combineAdjacentBlocks("{}" + line.replace(/([^{]*)(?:{[^\\]*([^}]*)})?/g, (match,text,overrides) => {
							// If there is no text or overrides, this is the end of the line.
							if (!text && !overrides) return "";

							// If we haven't seen any text yet, remove whitespace from the left.
							if (!lastSeenText) text = text.replace(/^[^\S\xA0]+/,"");
							lastSeenText = text;

							// If there was no override block, `overrides` will be undefined.
							// Otherwise it will be an empty string.
							return text + (overrides === undefined ? "" : "{" + overrides + "}");
						}));
						// Trim everything to the right of the last text we saw.
						if (lastSeenText) {
							lastSeenText = lastSeenText.replace(/[^\S\xA0]+$/,"");
							let i = line.lastIndexOf(lastSeenText);
							line = line.slice(0, i + lastSeenText.length);
						}

						let currblock = "", pieces = [], currPiece = "", hasTransition = false;

						// Loop through line pieces checking which ones need to be separated.
						for (let [overrides,text] of line.split("{").slice(1).map(y => y.split("}"))) {
							// if we need to start a new piece
							if (currPiece && (hasTransition || reProblem.test(overrides))) {
								hasTransition = hasTransition || /\\t(?!e)/.test(overrides);
								pieces.push(megablock + "}" + currPiece);
								megablock += currblock;
								currPiece = "";
								currblock = "";
							}
							currblock += overrides;
							currPiece += "{" + overrides + "}" + text;
						}

						// Add leftover piece if there is one.
						if (currPiece) {
							pieces.push(megablock + "}" + currPiece);
							megablock += currblock;
						}

						// Convert piece text into a NewLinePiece.
						let pieceNum = 0, newLine = pieces.map(piece => NewLinePiece(this, combineAdjacentBlocks(piece), ++pieceNum));
						newLine.shattered = false;
						this.lines.push(newLine);
					}
				} else {
					let newLine = [NewLinePiece(this,data.Text,0)];
					newLine.shattered = false;
					this.lines.push(newLine);
				}
			}

			SubtitleLine.prototype.init = function() {
				if (this.state == STATES.INITIALIZED) return;
				if (this.state == STATES.USED) this.clean();

				this.collisionOffset = 0;
				this.position = null;
				this.positionUpdateRequired = false;
				this.updates = {"fade":null,"move":null};

				this.group = createSVGElement("g");
				this.group.dataset.line = this.num;

				for (let line of this._lines)
					for (let piece of line)
						piece.init();

				this.state = STATES.INITIALIZED;

				checkCollisions(this);
			};
			SubtitleLine.prototype.start = function() {
				if (this.state != STATES.INITIALIZED) return;

				// add elements to the dom
				let BorderStyle = rendererBorderStyle || this.style.BorderStyle;
				if (BorderStyle == 3 || BorderStyle == 4) {
					let boxGroup = createSVGElement("g");
					if (BorderStyle == 3) {
						for (let line of this._lines)
							for (let piece of line)
								boxGroup.appendChild(piece.box);
					} else boxGroup.appendChild(this._lines[0][0].box);
					boxGroup.dataset.type = "bounding_boxes";
					this.group.appendChild(boxGroup);
				}
				let defs = SC.getElementsByTagName("defs")[0];
				for (let line of this._lines) {
					for (let piece of line) {
						this.group.appendChild(piece.group);
						if (piece.filter)
							defs.appendChild(piece.filter);
					}
				}
				SC.getElementById("layer" + this.data.Layer).appendChild(this.group);

				this.updatePosition();

				this.visible = true;
				this.state = STATES.USED;
			};
			SubtitleLine.prototype.update = function(t) {
				if (this.state != STATES.USED) return;

				let time = t * 1000;

				if (this.updates.fade) this.updates.fade(time);
				if (this.updates.move) this.updates.move(time);

				for (let line of this.lines)
					for (let piece of line)
						piece.update(time);

				if (this.positionUpdateRequired)
					this.updatePosition();
			};
			SubtitleLine.prototype.clean = function() {
				for (let line of this._lines) {
					for (let piece of line) {
						if (piece.filter) piece.filter.remove();
						piece.clean();
					}
				}

				if (this.group)
					this.group.remove();
				this.group = null;

				this.updates = null;

				this.visible = false;
				this.state = STATES.UNINITIALIZED;
			};

			SubtitleLine.prototype.updatePosition = function() {
				this.positionUpdateRequired = false;

				for (let line of this.lines)
					for (let piece of line)
						piece.updatePosition();

				// To support automatic text wrapping, lines that are too long
				// are shattered into the smallest pieces they can, and marked
				// as such. This allows the width of each piece to be
				// calculated so that the line can be wrapped as necessary.
				if (this.style.WrapStyle != 2) {
					let max_line_width = renderer.width - this.Margin.L - this.Margin.R;

					// Check Line Widths
					let newly_shattered = false;
					for (let i = 0; i < this._lines.length; ++i) {
						let pieces = this._lines[i];
						if (pieces.shattered) continue;
						let width = pieces.reduce((sum,piece) => sum + piece.width(), 0);

						// If the line is too wide, shatter it.
						if (width > max_line_width) {
							let new_pieces = shatterLine(pieces);
							this._lines[i] = new_pieces;

							for (let piece of new_pieces)
								piece.init();

							newly_shattered = true;
						}
					}

					// If any were shattered, renumber the pieces, and restart the line.
					if (newly_shattered) {
						let num = 1;
						for (let line of this._lines) {
							for (let piece of line) {
								piece.pieceNum = num;
								piece.group.dataset.piece = num;
								++num;
							}
						}

						// Re-initialize and start the line. We can return
						// after this because this function is called at the
						// end of `this.start()`.
						this.clean();
						this.init();
						this.start();
						return;
					}

					// If this line was not shattered and there aren't any width-changing transitions,
					// change its wrap style to not wrap (since it's unnecessary).
					if (!this._lines.some(x => x.shattered)) {
						// Some overrides can change the width of the line. If these are outside a
						// transition then they have already been applied, but we still need to
						// check for ones inside a transition.
						if (!hasWidthChangingBlock(this.data.Text))
							this.style.WrapStyle = 2;
					} else /* This line has been shattered. */ {
						// If a previously shattered and wrapped line
						// is too long, re-wrap the shattered lines.
						if (this.lines.some(line => line.shattered && line.reduce((sum,piece) => sum + piece.width(), 0) > max_line_width)) {
							let newLines = [];
							for (let line of this._lines) {
								if (line.shattered)
									newLines.push.apply(newLines,wrapLine(line,this.style.WrapStyle,max_line_width));
								else
									newLines.push(line);
							}
							this.lines = newLines;
						}
					}
				}

				if (this.lines.length > 1 || this.lines[0].length > 1) {
					let A = this.style.Alignment;
					let J = this.style.Justify;
					let widths = [], heights = [];


					// Align Horizontally
					for (let line of this.lines) {
						let totalWidth = 0, maxHeight = 0;

						// Align the pieces relative to the previous piece.
						if (A%3 == 1) { // Left Alignment
							for (let piece of line) {
								piece.splitLineOffset.x = totalWidth;
								totalWidth += piece.width();
								maxHeight = Math.max(maxHeight,piece.height());
							}
						} else if (A%3 == 2) { // Middle Alignment
							totalWidth = line.reduce((sum,piece) => sum + piece.width(), 0);
							let accumOffset = 0;
							for (let piece of line) {
								let sw = piece.width();
								piece.splitLineOffset.x = accumOffset + (sw - totalWidth) / 2;
								accumOffset += sw;
								maxHeight = Math.max(maxHeight,piece.height());
							}
						} else { // Right Alignment
							totalWidth = line.reduce((sum,piece) => sum + piece.width(), 0);
							let accumOffset = 0;
							for (let piece of line) {
								accumOffset += piece.width();
								piece.splitLineOffset.x = accumOffset - totalWidth;
								maxHeight = Math.max(maxHeight,piece.height());
							}
						}

						widths.push(totalWidth);
						heights.push(maxHeight);
					}


					// Justify
					// https://github.com/libass/libass/pull/241
					if (J && (A-J)%3 != 0) {
						let maxWidth = Math.max(...widths);
						for (let i = 0; i < this.lines.length; ++i) {
							let offset = maxWidth - widths[i];
							if (offset) {
								if ((J == 1 && A%3 == 2) || (J == 2 && A%3 == 0)) // To Left From Center or To Center From Right
									offset /= -2;
								else if (J == 1 && A%3 == 0) // To Left From Right
									offset = -offset;
								else if ((J == 3 && A%3 == 2) || (J == 2 && A%3 == 1)) // To Right From Center or To Center From Left
									offset /= 2;
								// else if (J == 3 && A%3 == 1) // To Right From Left
									// offset = offset;

								for (let piece of this.lines[i])
									piece.splitLineOffset.x += offset;
							}
						}
					}


					// Align Vertically
					if (true) { // So that this block can be collapsed.
						let lineOffset = 0;

						if (A > 6) { // Top Alignment
							for (let i = 0; i < this.lines.length; ++i) {
								let lineHeight = heights[i];
								for (let piece of this.lines[i])
									piece.splitLineOffset.y = lineOffset + lineHeight - piece.height();
								lineOffset += lineHeight;
							}
						} else {
							if (A > 3) { // Middle Alignment
								let totalHeight = heights.reduce((sum,height) => sum + height, 0);
								lineOffset = -totalHeight / 2;
								for (let i = 0; i < this.lines.length; ++i) {
									let lineHeight = heights[i];
									lineOffset += lineHeight / 2;
									for (let piece of this.lines[i])
										piece.splitLineOffset.y = lineOffset + (lineHeight - piece.height()) / 2;
									lineOffset += lineHeight / 2;
								}
							} else { // Bottom Alignment
								for (let i = this.lines.length - 1; i >= 0; --i) {
									let lineHeight = heights[i];
									for (let piece of this.lines[i])
										piece.splitLineOffset.y = lineOffset;
									lineOffset -= lineHeight;
								}
							}
						}

						// Align Text Baselines
						for (let line of this.lines) {
							let descents = line.map(piece => piece.descent());
							let maxLineDescent = Math.max(...descents);
							for (let i = 0; i < line.length; ++i)
								line[i].splitLineOffset.y += descents[i] - maxLineDescent;
						}
					}


					// Apply Changes
					for (let line of this.lines)
						for (let piece of line)
							piece.updatePosition();


					// Merge Border Boxes (for border style 4)
					let BorderStyle = rendererBorderStyle || this.style.BorderStyle;
					if (BorderStyle == 4) {
						let bounds = this.bounds();

						// use the first box for all of the pieces
						let box = this.lines[0][0].box;
						box.style.transform = ""; // rotations are not applied
						let B = parseFloat(box.style.strokeWidth);
						box.setAttribute("x", bounds.left - B / 2);
						box.setAttribute("y", bounds.top - B / 2);
						box.setAttribute("width", (bounds.right - bounds.left) + B);
						box.setAttribute("height", (bounds.bottom - bounds.top) + B);
					}
				}
			};

			SubtitleLine.prototype.addFade = function(a1,a2,a3,t1,t2,t3,t4) {
				let o1 = 1 - a1/255;
				let o2 = 1 - a2/255;
				let o3 = 1 - a3/255;
				let s = this.group.style;
				s.opacity = o1; // Prevent flickering at the start.
				this.updates.fade = t => {
					if (t <= t1) s.opacity = o1;
					else if (t1 < t && t < t2) s.opacity = o1 + (o2-o1) * (t-t1) / (t2-t1);
					else if (t2 < t && t < t3) s.opacity = o2;
					else if (t3 < t && t < t4) s.opacity = o2 + (o3-o2) * (t-t3) / (t4-t3);
					else s.opacity = o3;
				}
			};
			SubtitleLine.prototype.addMove = function(x1,y1,x2,y2,t1,t2,accel) {
				if (t1 === undefined) t1 = 0;
				if (t2 === undefined) t2 = this.time.milliseconds;
				if (accel === undefined) accel = 1;

				this.position = {x:x1,y:y1};

				this.updates.move = t => {
					if (t < t1) t = t1;
					if (t > t2) t = t2;

					let calc = Math.pow((t-t1)/(t2-t1),accel);
					let newX = x1 + (x2 - x1) * calc;
					let newY = y1 + (y2 - y1) * calc;

					let pos = this.position;
					if (pos.x != newX || pos.y != newY) {
						pos.x = newX;
						pos.y = newY;
						this.positionUpdateRequired = true;
					}
				};
			};

			SubtitleLine.prototype.bounds = function() {
				function maxExtents(extents,bounds) {
					extents.top = Math.min(extents.top, bounds.top);
					extents.left = Math.min(extents.left, bounds.left);
					extents.bottom = Math.max(extents.bottom, bounds.bottom);
					extents.right = Math.max(extents.right, bounds.right);
				}

				// Get bounds of first piece to start.
				let bounds = this.lines[0][0].cachedBounds;
				let extents = {
					top: bounds.top,
					left: bounds.left,
					bottom: bounds.bottom,
					right: bounds.right
				};

				// Get bounds of the rest of the first line.
				let firstLine = this.lines[0];
				for (let i = 1; i < firstLine.length; ++i)
					maxExtents(extents, firstLine[i].cachedBounds);

				// If there's more than one line, get the bounds of the
				// first and last piece in each subsequent line.
				for (let i = 1; i < this.lines.length; ++i) {
					let line = this.lines[i];

					// first piece
					maxExtents(extents, line[0].cachedBounds);

					// last piece
					if (line.length > 1)
						maxExtents(extents, line[line.length-1].cachedBounds);
				}

				return extents;
			};

			return (data,num) => new SubtitleLine(data,num);
		})();


		// Read subtitle file into JavaScript objects.
		function parse_info(assfile,i) {
			var info = {};
			for (; i < assfile.length; ++i) {
				var line = assfile[i] = assfile[i].trim();
				if (line) {
					if (line.charAt(0) == "[") break;
					if (line.charAt(0) == "!" || line.charAt(0) == ";") continue;
					var keyval = line.split(":");
					if (keyval.length != 2) continue;
					info[keyval[0].trim()] = keyval[1].trim();
				}
			}
			return [info,i-1];
		}
		function parse_styles(assfile,i,isV4Plus) {
			// The first line should be the format line. If it's not, assume the default.
			let format_map, line = assfile[i] = assfile[i].trim();
			if (line.startsWith("Format:"))
				format_map = line.slice(7).split(",").map(x => x.trim());
			else
				format_map = ["Fontname","Fontsize","PrimaryColour","SecondaryColour","OutlineColour","BackColour","Bold","Italic","Underline","StrikeOut","ScaleX","ScaleY","Spacing","Angle","BorderStyle","Outline","Shadow","Alignment","MarginL","MarginR","MarginV","Encoding","Blur","Justify"];

			let styles = {};
			for (++i; i < assfile.length; ++i) {
				line = assfile[i] = assfile[i].trim();
				if (line.charAt(0) == "[") break;
				if (!line.startsWith("Style:")) continue;

				// Split the style line into its values.
				let values = line.slice(6).split(",").map(x => x.trim());

				// Convert the array of values into an object using the format map.
				let new_style = {isV4Plus:isV4Plus};
				for (let j = 0; j < values.length; ++j)
					new_style[format_map[j]] = values[j];
				new_style.Name = new_style.Name.replace(/[^_a-zA-Z0-9-]/g,"_");

				styles[new_style.Name] = new_style;
			}
			return [styles,i-1];
		}
		function parse_events(assfile,i) {
			var events = []; events.line = i + 1;
			var map = assfile[i].replace("Format:","").split(",").map(x => x.trim());
			for (++i; i < assfile.length; ++i) {
				var line = assfile[i] = assfile[i].trim();
				if (line.charAt(0) == "[") break;
				if (!line.startsWith("Dialogue:")) continue;

				var elems = line.slice(9).trim().split(",");
				var j, new_event = {};
				for (j = 0; map[j] != "Text" && j < map.length; ++j)
					new_event[map[j]] = elems[j];
				new_event.Style = new_event.Style.replace(/[^_a-zA-Z0-9-]/g,"_");
				if (map[j] == "Text") new_event.Text = elems.slice(j).join(",").trim();
				else continue;

				// Remove leading and trailing whitespace and fix some issues that could exist in the override blocks.
				let last_seen_text = '', pathVal = 0;
				new_event.Text = combineAdjacentBlocks(new_event.Text.replace(/([^{]*)(?:{[^\\]*([^}]*)})?/g, (match,text,overrides) => {
					// If there is no text or overrides, this is the end of the line.
					if (!text && !overrides) return "";

					// If we haven't seen any text yet, remove whitespace from the left.
					if (!last_seen_text) text = text.replace(/^\s+/,"");

					// Replace '\h' in the text with the non-breaking space.
					text = text.replace(/\\h/g,"\xA0");
					last_seen_text = text;

					// If there are no overrides, we can return here.
					// If there was no override block, `overrides` will be undefined.
					// Otherwise it will be an empty string.
					if (!overrides) return text + (overrides === "" ? "{}" : "");

					// Close transitions with \te instead of parentheses.
					overrides = overrides.replace(/(\\t(?!e)[^\\]*(?:\\[^t][^\\()]*(?:\([^)]*\))?)*)(?:\)[^\\]*|(?=\\t)|$)/g,"$1\\te");

					// Remove all extraneous whitespace and parentheses.
					// Whitespace must be kept inside:
					// \fn names, \r style names, and \clip and \iclip path code.
					// Parentheses will be allowed in \fn names and \r style names.
					overrides = overrides.replace(/(?:\\(?:(?:((?:fn|r))\s*([^\\]*))|(?:(i?clip)[\s(]*([^\\)]*)[^\\]*)))?[\s()]*/g, (M,frn,frn_arg,iclip,iclip_arg) => {
						let ret = (frn || iclip ? "\\" : "");
						if (frn) ret += frn + frn_arg.trim();
						if (iclip) ret += iclip + iclip_arg.trim().split(/\s*,\s*/g).join(",");
						return ret;
					});

					// Check for a \p override and get the value of the last one,
					// then remove all of them and add the last one back to the end.
					let p_overrides = overrides.match(/\\p[\d.]+/g);
					if (p_overrides) {
						pathVal = parseFloat(p_overrides[p_overrides.length-1].slice(2));
						overrides = overrides.replace(/\\p[\d.]+/g,"");
						if (pathVal == 0) overrides += "\\p0";
					}
					// Even if this block didn't have a path override,
					// it could have carried over from the previous block.
					if (pathVal) overrides += `\\p${pathVal}`;

					return text + "{" + overrides + "}";
				}));

				// Only add the line if we actually saw any text in it.
				if (last_seen_text) {
					// But first trim everything to the right of the last text we saw.
					last_seen_text = last_seen_text.replace(/[^\S\xA0]+$/,"");
					let i = new_event.Text.lastIndexOf(last_seen_text);
					new_event.Text = new_event.Text.slice(0, i + last_seen_text.length);
					events.push(new_event);
				}
			}
			return [events,i-1];
		}
		function parse_fonts(assfile,i) {
			let fonts = {}, currFontName;
			for (; i < assfile.length; ++i) {
				let line = assfile[i];
				if (line.charAt(0) == "[") break;
				if (line.startsWith("fontname")) {
					let fontdata = "", fontname = line.split(":")[1].trim();
					for (++i; i < assfile.length; ++i) {
						let line = assfile[i];
						// The encoding used for the font ensures
						// there are no lowercase letters.
						if (/[a-z]/.test(line)) {
							--i;
							break;
						}
						fontdata += line;
					}
					fonts[fontname] = fontdata;
				}
			}

			// Decode the fonts.
			for (let fontname in fonts) {
				let fontdata = fonts[fontname];

				let end = fontdata.slice(-1 * (fontdata.length % 4));
				if (end) fontdata = fontdata.slice(0, -1 * end.length);

				let decoded = "";
				for (let i = 0; i < fontdata.length; i += 4) {
					let bits = [fontdata[i],fontdata[i+1],fontdata[i+2],fontdata[i+3]].map(c => c.charCodeAt() - 33);
					let word = (bits[0] << 18) | (bits[1] << 12) | (bits[2] << 6) | bits[3];
					decoded += String.fromCharCode((word >> 16) & 0xFF, (word >> 8) & 0xFF, word & 0xFF);
				}

				if (end.length == 3) {
					let bits = [end[0],end[1],end[2]].map(c => c.charCodeAt() - 33);
					let word = (((bits[0] << 12) | (bits[1] << 6) | bits[2]) / 0x10000) | 0;
					decoded += String.fromCharCode((word >> 16) & 0xFF, (word >> 8) & 0xFF);
				} else if (end.length == 2) {
					let bits = [end[0],end[1]].map(c => c.charCodeAt() - 33);
					let word = (((bits[0] << 6) | bits[1]) / 0x100) | 0;
					decoded += String.fromCharCode((word >> 16) & 0xFF);
				}

				fonts[fontname] = decoded;
			}

			// Set fonts to null if there were no fonts.
			fonts = (() => {
				for (let f in fonts)
					return fonts;
				return null;
			})();

			return [fonts,i-1];
		}
		function parse_ass_file(asstext) {
			var assdata = {styles:{}};
			var assfile = asstext.split(/\r\n|\r|\n/g);
			for (var i = 0; i < assfile.length; ++i) {
				var line = assfile[i] = assfile[i].trim();
				if (line && line.charAt(0) == "[") {
					if (line == "[Script Info]")
						[assdata.info,i] = parse_info(assfile,i+1);
					else if (line.includes("Styles"))
						[assdata.styles,i] = parse_styles(assfile,i+1,line.includes("+"));
					else if (line == "[Events]")
						[assdata.events,i] = parse_events(assfile,i+1);
					else if (line == "[Fonts]")
						[assdata.fonts,i] = parse_fonts(assfile,i+1);
				}
			}
			return assdata;
		}

		// Convert parsed subtitle file into HTML/CSS/SVG.
		function parse_head(info) {
			if (state != STATES.INITIALIZING) return;

			// Parse/Calculate width and height.
			var width = 0, height = 0;
			if (info.PlayResX) width = parseFloat(info.PlayResX);
			if (info.PlayResY) height = parseFloat(info.PlayResY);
			if (width <= 0 && height <= 0) {
				width = 384;
				height = 288;
			} else {
				if (height <= 0)
					height = (width == 1280 ? 1024 : Math.max(1, width * 3 / 4));
				else if (width <= 0)
					width = (height == 1024 ? 1280 : Math.max(1, height * 4 / 3));
			}

			SC.setAttribute("viewBox", "0 0 " + width + " " + height);
			SC.setAttribute("height", height);
			SC.setAttribute("width", width);

			renderer.width = width;
			renderer.height = height;

			ScaledBorderAndShadow = info.ScaledBorderAndShadow ? Boolean(info.ScaledBorderAndShadow.toLowerCase() == "yes" || parseInt(info.ScaledBorderAndShadow,10)) : true;
			TimeOffset = parseFloat(info.TimeOffset) || 0;
			PlaybackSpeed = (100 / info.Timer) || 1;
			renderer.WrapStyle = (info.WrapStyle ? parseInt(info.WrapStyle,10) : 2);
			reverseCollisions = info.Collisions && info.Collisions.toLowerCase() == "reverse";
		}
		function write_fonts(fonts,styles) {
			if (state != STATES.INITIALIZING || fonts == null) return;

			// Add the style HTML element.
			if (!fontCSS) {
				fontCSS = document.createElement("style");
				SC.insertBefore(fontCSS, SC.firstChild);
			}

			// Get a set of the names of all the fonts used by the styles.
			let styleFonts = new Set();
			for (let key in styles) {
				let style = styles[key];
				if (style.Fontname) {
					if (style.Fontname.charAt(0) == "@") {
						styleFonts.add(style.Fontname.slice(1));
					} else styleFonts.add(style.Fontname);
				}
			}
			styleFonts.delete("Arial");
			styleFonts.delete("ArialMT");

			let css = "";
			for (let font in fonts) {
				let fontdata = fonts[font];

				// Try to get the font filename and extension.
				let fontname = font, submime = "*";
				if (font.endsWith(".ttf") || font.endsWith(".ttc")) {
					fontname = font.slice(0,-4);
					submime = "ttf";
				} else if (font.endsWith(".otf") || font.endsWith(".eot")) {
					fontname = font.slice(0,-4);
					submime = "otf";
				}

				// If the current fontname isn't used by any style,
				// check for one of the style fonts in the font data.
				if (!styleFonts.has(fontname)) {
					for (let name of styleFonts) {
						if (fontdata.includes(name)) {
							fontname = name;
							break;
						}
					}
				}

				// Create the font-face CSS.
				css += "@font-face {\n";
				css += "  font-family: \"" + fontname + "\";\n";
				css += "  src: url(data:font/" + submime + ";charset=utf-8;base64," + btoa(fontdata) + ");\n";
				css += "}\n\n";
			}

			fontCSS.innerHTML = css;
		}
		function write_styles(styles) {
			if (state == STATES.UNINITIALIZED || state == STATES.RESTARTING_INIT) return;

			function set_style_defaults(style) {
				// If the font name starts with "@" it is supposed to be displayed vertically.
				style.Vertical = false;
				if (style.Fontname) {
					if (style.Fontname.charAt(0) == "@") {
						style.Fontname = style.Fontname.slice(1);
						style.Vertical = true;
					}
				} else style.Fontname = "Arial";
				style.Fontsize = parseInt(style.Fontsize,10) || 40;

				// Set default colors.
				style.PrimaryColour = style.PrimaryColour || "&HFFFFFF"; // white
				style.SecondaryColour = style.SecondaryColour || "&HFF0000"; // blue
				style.OutlineColour = style.OutlineColour || style.TertiaryColour || "&H000000"; // black
				style.BackColour = style.BackColour || "&H000000"; // black

				// Parse hex colors.
				[style.c1a, style.c1r, style.c1g, style.c1b] = colorToARGB(style.PrimaryColour);
				[style.c2a, style.c2r, style.c2g, style.c2b] = colorToARGB(style.SecondaryColour);
				[style.c3a, style.c3r, style.c3g, style.c3b] = colorToARGB(style.OutlineColour);
				[style.c4a, style.c4r, style.c4g, style.c4b] = colorToARGB(style.BackColour);

				style.Bold = parseInt(style.Bold,10) || 0;
				style.Italic = Boolean(parseInt(style.Italic,10));
				style.Underline = Boolean(parseInt(style.Underline,10));
				style.StrikeOut = Boolean(parseInt(style.StrikeOut,10));

				style.ScaleX = parseFloat(style.ScaleX) || 100;
				style.ScaleY = parseFloat(style.ScaleY) || 100;

				style.Spacing = parseFloat(style.Spacing) || 0;
				style.Angle = parseFloat(style.Angle) || 0;
				if (style.Vertical) style.Angle -= 270; // Why 270?

				style.BorderStyle = parseInt(style.BorderStyle,10) || 1;
				style.Outline = parseFloat(style.Outline) || 0;
				style.Shadow = parseFloat(style.Shadow) || 0;
				if (style.Shadow) {
					if (style.Outline == 0) style.Outline = 1;
					style.ShOffX = style.Shadow;
					style.ShOffY = style.Shadow;
				} else {
					style.ShOffX = 0;
					style.ShOffY = 0;
				}

				style.Alignment = parseInt(style.Alignment,10) || 2;
				if (!style.isV4Plus) style.Alignment = SSA_ALIGNMENT_MAP[style.Alignment];
				delete style.isV4Plus;

				style.MarginL = parseFloat(style.MarginL) || 0;
				style.MarginR = parseFloat(style.MarginR) || 0;
				style.MarginV = parseFloat(style.MarginV) || 0;

				delete style.Encoding;

				style.BE = 0;
				style.Blur = parseFloat(style.Blur) || 0;
				style.Justify = Boolean(parseInt(style.Justify,10));

				// Clone the object and freeze it.
				return Object.freeze(JSON.parse(JSON.stringify(style)));
			}
			function style_to_css(style) {
				let css = `font-family: ${style.Fontname};\n`;
				css += `font-size: ${getFontMetrics(style.Fontname,style.Fontsize).size}px;\n`;

				if (style.Bold) css += "font-weight: bold;\n";
				if (style.Italic) css += "font-style: italic;\n";
				if (style.Underline || style.StrikeOut) {
					css += "text-decoration:";
					if (style.Underline) css += " underline";
					if (style.StrikeOut) css += " line-through";
					css += ";\n";
				}

				if (style.Vertical)
					css += "writing-mode: vertical-rl;\n";

				css += `fill: rgba(${style.c1r},${style.c1g},${style.c1b},${style.c1a});\n`;
				css += `stroke: rgba(${style.c3r},${style.c3g},${style.c3b},${style.c3a});\n`;
				css += `stroke-width: ${style.Outline}px;\n`;
				css += `margin: ${style.MarginV}px ${style.MarginR}px ${style.MarginV}px ${style.MarginL}px;\n`;

				return css;
			}

			// Add the style HTML element.
			if (!styleCSS) {
				styleCSS = document.createElement("style");
				if (fontCSS) SC.insertBefore(styleCSS, fontCSS.nextElementSibling);
				else SC.insertBefore(styleCSS, SC.firstChild);
			}

			// This is NOT the same as set_style_defaults().
			if (!styles.Default) {
				styles.Default = {
					Name: "Default",
					Outline: 2,
					MarginL: 10,
					MarginR: 10,
					MarginV: 20,
					Blur: 2
				};
			}

			// Set the style object defaults and convert them to CSS.
			let css = "";
			for (let name in styles) {
				if (!Object.isFrozen(styles[name]))
					styles[name] = set_style_defaults(styles[name]);
				css += `\n.${styleNameToClassName(name)} {\n${style_to_css(styles[name])}}\n`;
			}
			styleCSS.innerHTML = css.slice(1,-1);
			renderer.styles = Object.freeze(styles);
		}
		function init_subs(subtitle_lines) {
			if (state != STATES.INITIALIZING) return;

			var line_num = subtitle_lines.line;
			var layers = {};
			subtitles = [];
			collisions = {"upper": {}, "lower": {}};

			for (var line_data of subtitle_lines) {
				layers[line_data.Layer] = true;
				subtitles.push(NewSubtitleLine(line_data,line_num++));
			}

			for (var layer of Object.keys(layers)) {
				var d = createSVGElement("g");
					d.id = "layer" + layer;
				SC.appendChild(d);
			}
		}

		this.running = () => !paused;
		this.pause = function() {
			paused = true;
		};
		this.resume = function() {
			paused = false;
			if (state == STATES.UNINITIALIZED) renderer.init();
			else if (state == STATES.INITIALIZED) addAnimationTask(mainLoop);
		};
		this.resize = function() {
			if (state != STATES.INITIALIZED) return;

			if (video.videoWidth / video.videoHeight > video.clientWidth / video.clientHeight) { // letterboxed top and bottom
				var activeVideoHeight = video.clientWidth * video.videoHeight / video.videoWidth;
				SC.style.width = "100%";
				SC.style.height = activeVideoHeight + "px";
				SC.style.margin = ((video.clientHeight - activeVideoHeight) / 2) + "px 0px";
			} else { // letterboxed left and right
				var activeVideoWidth = video.clientHeight * video.videoWidth / video.videoHeight;
				SC.style.width = activeVideoWidth + "px";
				SC.style.height = "100%";
				SC.style.margin = "0px " + ((video.clientWidth - activeVideoWidth) / 2) + "px";
			}
		};

		this.setBorderStyle = x => (rendererBorderStyle = parseInt(x,10));
		this.addEventListeners = function() {
			if (state != STATES.INITIALIZED) return;
			video.addEventListener("pause",renderer.pause);
			video.addEventListener("play",renderer.resume);
			window.addEventListener("resize",renderer.resize);
			document.addEventListener("mozfullscreenchange",renderer.resize);
			document.addEventListener("webkitfullscreenchange",renderer.resize);
		};
		this.removeEventListeners = function() {
			video.removeEventListener("pause",renderer.pause);
			video.removeEventListener("play",renderer.resume);
			window.removeEventListener("resize",renderer.resize);
			document.removeEventListener("mozfullscreenchange",renderer.resize);
			document.removeEventListener("webkitfullscreenchange",renderer.resize);
		};

		this.setSubFile = function(file) {
			if (subFile == file) return;

			subFile = file;

			switch (state) {
				case STATES.UNINITIALIZED:
					// Nothing's been done, so there's nothing to do.
					break;
				case STATES.INITIALIZING:
					// Since we have a new file now, we'll need to re-initialize everything.
					state = STATES.RESTARTING_INIT;
					break;
				case STATES.RESTARTING_INIT:
					// We're already restarting, so we don't have to do anything here.
					break;
				case STATES.INITIALIZED:
					// We will need to re-initialize before using the new file.
					state = STATES.UNINITIALIZED;
					break;
			}
		};
		this.init = function() {
			if (!subFile) return;

			// If we're already initializing, cancel that one and restart.
			if (state == STATES.INITIALIZING) {
				state = STATES.RESTARTING_INIT;
				initRequest.abort();
				addTask(renderer.init);
				return;
			}

			state = STATES.INITIALIZING;

			initRequest = new XMLHttpRequest();
			initRequest.open("get",subFile,true);
			initRequest.onreadystatechange = function() {
				if (this.readyState != 4 || !this.responseText) return;
				if (state != STATES.INITIALIZING) {
					if (state == STATES.RESTARTING_INIT)
						addTask(renderer.init);
					return;
				}

				renderer.clean();
				state = STATES.INITIALIZING;
				let assdata = parse_ass_file(this.responseText);

				function templocal() {
					video.removeEventListener("loadedmetadata",templocal);

					if (state != STATES.INITIALIZING) {
						if (state == STATES.RESTARTING_INIT)
							addTask(renderer.init);
						return;
					}

					parse_head(assdata.info);
					write_fonts(assdata.fonts,assdata.styles);
					write_styles(assdata.styles);
					init_subs(assdata.events);
					state = STATES.INITIALIZED;
					addTask(renderer.resize);
					addTask(renderer.addEventListeners);
					addAnimationTask(mainLoop);
				}

				// Wait for video metadata to be loaded.
				if (video.readyState) templocal();
				else video.addEventListener("loadedmetadata",templocal);
			};
			initRequest.send();
		};
		this.clean = function() {
			renderer.removeEventListeners();
			for (let S of subtitles) S.clean();
			subtitles = [];
			collisions = {"upper": {}, "lower": {}};
			SC.innerHTML = "<defs></defs>";
			fontCSS = null;
			styleCSS = null;
			state = STATES.UNINITIALIZED;
		};

		function mainLoop() {
			if (video.paused) renderer.pause();
			if (paused || state != STATES.INITIALIZED) return;

			var time = video.currentTime + TimeOffset;
			if (Math.abs(time-lastTime) >= 0.01) {
				lastTime = time;

				// Display Subtitles
				for (var S of subtitles) {
					if (S.state == STATES.UNINITIALIZED && S.time.start <= time + 3) {
						addTask(S.init.bind(S)); // Initialize subtitles early so they're ready.
						S.state = STATES.INITIALIZING;
					} else if (S.time.start <= time && time <= S.time.end) {
						// Don't start and update on the same frame. The SVG
						// elements need to be drawn once in their original
						// state before applying a new transition.
						if (!S.visible) S.start()
						else S.update(time - S.time.start);
					} else if (S.visible) S.clean();
				}

				// Check for collisions and reposition lines if necessary.
				for (let region of ["upper","lower"]) {
					// Collisions are split into upper and lower regions for
					// performance reasons, and because we can't actually do
					// anything if lines from those two regions collide. Layers
					// also don't collide, so we can split on them too.
					for (let layer in collisions[region]) {
						// While looping through the potential collisions in a
						// layer, if any of them collide, we need to go back
						// and search again. The handles the case where lines B
						// and C collide with line A and are offset, which then
						// causes lines B and C to collide with each other.
						let anyCollisions = true;
						while (anyCollisions) {
							anyCollisions = false;
							for (let collision of collisions[region][layer]) {
								if (collision[0] && collision[1] && collision[0].visible && collision[1].visible) {
									let B0 = collision[0].bounds(), B1 = collision[1].bounds();
									if (boundsOverlap(B0,B1)) {
										let overlap = region == "upper" ? B0.bottom - B1.top : B1.top - B0.bottom;
										collision[1].collisionOffset += overlap;
										collision[1].updatePosition();
										anyCollisions = true;
									}
								}
							}
						}
					}
				}
			}

			addAnimationTask(mainLoop);
		}
	}


	/* Subtitle Object
		video:		the <video> element
		container:	the <svg> element
		renderer:	the Renderer object
	*/
	let subtitles = []; // array of all subtitle objects
	let SubtitleManager = {}; // object to return

	SubtitleManager.add = function(video,filepath,show) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (!SubtitleObject) {
			let SC = createSVGElement("svg");
				SC.classList.add("subtitle_container");
			video.parentElement.appendChild(SC);

			SubtitleObject = {
				video: video,
				container: SC,
				renderer: new Renderer(SC,video)
			};
			subtitles.push(SubtitleObject);
		}

		if (filepath) {
			SubtitleObject.renderer.setSubFile(filepath);
			if (show) {
				SubtitleObject.renderer.init();
				SubtitleObject.renderer.resume();
			}
		}
		SubtitleObject.container.style.display = SubtitleObject.renderer.running() ? "" : "none";
	};

	SubtitleManager.remove = function(video) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) {
			SubtitleObject.renderer.clean();
			SubtitleObject.container.remove();
			subtitles.splice(subtitles.indexOf(SubtitleObject),1);
		}
	};

	SubtitleManager.show = function(video) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) {
			SubtitleObject.renderer.resume();
			SubtitleObject.renderer.addEventListeners();
			SubtitleObject.container.style.display = "";
		}
	};

	SubtitleManager.hide = function(video) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) {
			SubtitleObject.container.style.display = "none";
			SubtitleObject.renderer.removeEventListeners();
			SubtitleObject.renderer.pause();
		}
	};

	SubtitleManager.visible = function(video) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		return SubtitleObject ? SubtitleObject.container.style.display != "none" : false;
	};

	SubtitleManager.setSubtitleFile = function(video,filepath) {
		if (!filepath) return;
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) SubtitleObject.renderer.setSubFile(filepath);
	};

	SubtitleManager.setBorderStyle = function(video,style) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) SubtitleObject.renderer.setBorderStyle(style || 0);
	};

	SubtitleManager.reload = function(video) {
		let SubtitleObject = subtitles.find(S => video == S.video);
		if (SubtitleObject) SubtitleObject.renderer.init();
	};

	return SubtitleManager;
})();
