import { Location } from "@angular/common";
import {
	AfterViewInit,
	Component, ElementRef, HostListener,
	Injector,
	OnDestroy,
	OnInit,
	Pipe,
	PipeTransform,
	ViewChild,
	ViewEncapsulation
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { ActivatedRoute, Event, NavigationCancel, NavigationEnd, NavigationStart, Router } from "@angular/router";
import { OidcSecurityService } from "angular-auth-oidc-client";
import * as Hls from "hls.js";
import {
	getPlaybackMethod,
	getWhatIsSupported,
	method,
	SupportList
} from "../../../videoSupport/playbackMethodDetector";
import { AppComponent } from "../../app.component";
import { Track, WatchItem } from "../../models/watch-item";

declare var SubtitleManager: any;

@Pipe({
	name: "formatTime",
	pure: true
})
export class FormatTimePipe implements PipeTransform
{
	transform(value: number, hourCheck: number = null): string
	{
		if (isNaN(value) || value === null || value === undefined)
			return `??:??`;
		hourCheck ??= value;
		if (hourCheck >= 3600)
			return new Date(value * 1000).toISOString().substr(11, 8);
		return new Date(value * 1000).toISOString().substr(14, 5);
	}
}

@Pipe({
	name: "bufferToWidth",
	pure: true
})
export class BufferToWidthPipe implements PipeTransform
{
	transform(buffered: TimeRanges, duration: number): string
	{
		if (buffered.length == 0)
			return "0";
		return `${buffered.end(buffered.length - 1) / duration * 100}%`;
	}
}

@Component({
	selector: "app-player",
	templateUrl: "./player.component.html",
	styleUrls: ["./player.component.scss"],
	encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnInit, OnDestroy, AfterViewInit
{
	item: WatchItem;
	selectedSubtitle: Track;
	playMethod: method = method.direct;
	supportList: SupportList;
	playing: boolean = true;
	loading: boolean = false;
	seeking: boolean = false;
	muted: boolean = false;

	private _volume: number = 100;
	get volume(): number { return this._volume; }
	set volume(value: number) { this._volume = Math.max(0, Math.min(value, 100)); }

	@ViewChild("player") private playerRef: ElementRef;
	private get player(): HTMLVideoElement { return this.playerRef.nativeElement; }
	@ViewChild("progressBar") private progressBarRef: ElementRef;
	private get progressBar(): HTMLElement { return this.progressBarRef.nativeElement; }

	controlHider: NodeJS.Timeout = null;
	areControlHovered: boolean = false;
	private _showControls: boolean = true;
	get showControls(): boolean { return this._showControls; }
	set showControls(value: boolean)
	{
		this._showControls = value;
		if (this.controlHider)
			clearTimeout(this.controlHider);
		if (value)
		{
			this.controlHider = setTimeout(() =>
			{
				if (!this.player.paused && !this.areControlHovered)
					this.showControls = false;
				// else restart timer
			}, 2500);
		}
		else
			this.controlHider = null;
	}

	methodType = method;
	displayStats: boolean = false;


	private hlsPlayer: Hls = new Hls();
	private oidcSecurity: OidcSecurityService;
	constructor(private route: ActivatedRoute,
	            private sanitizer: DomSanitizer,
	            private snackBar: MatSnackBar,
	            private title: Title,
	            private router: Router,
	            private location: Location,
	            private injector: Injector)
	{ }

	ngOnInit()
	{
		document.getElementById("nav").classList.add("d-none");
		if (AppComponent.isMobile)
		{
			if (!this.isFullScreen)
				this.fullscreen();
			screen.orientation.lock("landscape");
			$(document).on("fullscreenchange", () =>
			{
				if (document.fullscreenElement == null && this.router.url.startsWith("/watch"))
					this.back();
			});
		}

		this.route.data.subscribe(data =>
		{
			this.item = data.item;

			const name: string = this.item.isMovie
				? this.item.showTitle
				: `${this.item.showTitle} S${this.item.seasonNumber}:E${this.item.episodeNumber}`;

			if (this.item.isMovie)
				this.title.setTitle(`${name} - Kyoo`);
			else
				this.title.setTitle(`${name} - Kyoo`);

			setTimeout(() =>
			{
				this.snackBar.open(`Playing: ${name}`, null, {
					verticalPosition: "top",
					horizontalPosition: "right",
					duration: 2000,
					panelClass: "info-panel"
				});
			}, 750);
		});

		this.router.events.subscribe((event: Event) =>
		{
			switch (true)
			{
				case event instanceof NavigationStart:
					this.loading = false;
					break;
				case event instanceof NavigationEnd:
				case event instanceof NavigationCancel:
					this.loading = true;
					break;
				default:
					break;
			}
		});
	}

	ngOnDestroy()
	{
		if (this.isFullScreen)
			document.exitFullscreen();

		document.getElementById("nav").classList.remove("d-none");
		this.title.setTitle("Kyoo");

		$(document).off();
	}

	ngAfterViewInit()
	{
		setTimeout(() => this.route.data.subscribe(() =>
		{
			let queryMethod: string = this.route.snapshot.queryParams["method"];
			this.selectPlayMethod(queryMethod ? method[queryMethod] : getPlaybackMethod(this.player, this.item));

			const subSlug: string = this.route.snapshot.queryParams["sub"];
			if (subSlug != null)
			{
				const languageCode: string = subSlug.substring(0, 3);
				const forced: boolean = subSlug.length > 3 && subSlug.substring(4) == "for";
				const sub: Track = this.item.subtitles.find(x => x.language == languageCode && x.isForced == forced);
				this.selectSubtitle(sub, false);
			}

			this.supportList = getWhatIsSupported(this.player, this.item);
		}));
		this.showControls = true;
	}

	get isFullScreen(): boolean
	{
		return document.fullscreenElement != null;
	}

	get isMobile(): boolean
	{
		return AppComponent.isMobile;
	}

	getTimeFromSeekbar(pageX: number)
	{
		const value: number = (pageX - this.progressBar.offsetLeft) / this.progressBar.clientWidth;
		const percent: number = Math.max(0, Math.min(value, 1));
		return percent * this.player.duration;
	}

	startSeeking(event: MouseEvent | TouchEvent): void
	{
		event.preventDefault();
		this.seeking = true;
		this.player.pause();
		const pageX: number = "pageX" in event ? event.pageX : event.changedTouches[0].pageX;
		this.player.currentTime = this.getTimeFromSeekbar(pageX);
	}

	@HostListener("document:mouseup", ["$event"])
	@HostListener("document:touchend", ["$event"])
	endSeeking(event: MouseEvent | TouchEvent): void
	{
		if (!this.seeking)
			return;
		event.preventDefault();
		this.seeking = false;
		const pageX: number = "pageX" in event ? event.pageX : event.changedTouches[0].pageX;
		this.player.currentTime = this.getTimeFromSeekbar(pageX);
		this.player.play();
	}

	@HostListener("document:touchmove", ["$event"])
	touchSeek(event)
	{
		if (this.seeking)
			this.player.currentTime = this.getTimeFromSeekbar(event.changedTouches[0].pageX);
	}

	@HostListener("document:mousemove", ["$event"])
	mouseMove(event)
	{
		if (this.seeking)
			this.player.currentTime = this.getTimeFromSeekbar(event.pageX);
		else
			this.showControls = true;
	}

	playbackError(): void
	{
		if (this.playMethod == method.transcode)
		{
			this.snackBar.open("This episode can't be played.", null, {
				horizontalPosition: "left",
				panelClass: ["snackError"],
				duration: 10000
			});
		}
		else
		{
			if (this.playMethod == method.direct)
				this.playMethod = method.transmux;
			else
				this.playMethod = method.transcode;
			this.selectPlayMethod(this.playMethod);
		}
	}

	selectPlayMethod(playMethod: method)
	{
		this.playMethod = playMethod;

		if (this.oidcSecurity === undefined)
			this.oidcSecurity = this.injector.get(OidcSecurityService);
		this.hlsPlayer.config.xhrSetup = xhr =>
		{
			const token = this.oidcSecurity.getToken();
			if (token)
				xhr.setRequestHeader("Authorization", "Bearer " + token);
		};

		if (this.playMethod == method.direct)
			this.player.src = `/video/${this.item.slug}`;
		else
		{
			this.hlsPlayer.loadSource(`/video/${this.playMethod.toLowerCase()}/${this.item.slug}/`);
			this.hlsPlayer.attachMedia(this.player);
			this.hlsPlayer.on(Hls.Events.MANIFEST_LOADED, () =>
			{
				this.player.play();
			});
		}
	}

	back()
	{
		this.router.navigate(["/show", this.item.showSlug]);
	}

	next()
	{
		if (this.item.nextEpisode == null)
			return;
		this.router.navigate(["/watch", this.item.nextEpisode.slug], {
			queryParamsHandling: "merge"
		});
	}

	previous()
	{
		if (this.item.previousEpisode == null)
			return;
		this.router.navigate(["/watch", this.item.previousEpisode], {
			queryParamsHandling: "merge"
		});
	}

	videoClicked()
	{
		if (!navigator.userAgent.match(/Mobi/))
			this.togglePlayback();
		else
		{
			if ($("#hover").hasClass("idle"))
			{
				$("#hover").removeClass("idle");
				clearTimeout(this.controlHider);
				this.controlHider = setTimeout((ev: MouseEvent) =>
				{
					if (!this.player.paused)
					{
						document.getElementById("hover").classList.add("idle");
					}
				}, 1000);
			}
			else
			{
				$("#hover").addClass("idle");
				clearTimeout(this.controlHider);
			}
		}
	}

	togglePlayback()
	{
		if (this.player.paused)
			this.player.play();
		else
			this.player.pause();
	}

	fullscreen()
	{
		if (document.fullscreenElement == null)
			document.body.requestFullscreen();
		else
			document.exitFullscreen();
	}

	getVolumeBtn(): string
	{
		if (this.volume == 0 || this.muted)
			return "volume_off";
		else if (this.volume < 25)
			return "volume_mute";
		else if (this.volume < 65)
			return "volume_down";
		else
			return "volume_up";
	}

	selectSubtitle(subtitle: Track, changeUrl: boolean = true)
	{
		if (changeUrl)
		{
			let subSlug: string;
			if (subtitle != null)
			{
				subSlug = subtitle.language;
				if (subtitle.isForced)
					subSlug += "-for";
			}

			this.router.navigate([], {
				relativeTo: this.route,
				queryParams: {sub: subSlug},
				replaceUrl: true,
				queryParamsHandling: "merge"
			});
		}

		this.selectedSubtitle = subtitle;

		if (subtitle == null)
		{
			this.snackBar.open("Subtitle removed.", null, {
				verticalPosition: "top",
				horizontalPosition: "right",
				duration: 750,
				panelClass: "info-panel"
			});
			SubtitleManager.remove(this.player);
			this.removeHtmlTrack();
		}
		else
		{
			this.snackBar.open(`${subtitle.displayName} subtitle loaded.`, null, {
				verticalPosition: "top",
				horizontalPosition: "right",
				duration: 750,
				panelClass: "info-panel"
			});
			this.removeHtmlTrack();

			if (subtitle.codec == "ass")
				SubtitleManager.add(this.player, `subtitle/${subtitle.slug}`, true);
			else if (subtitle.codec == "subrip")
			{
				SubtitleManager.remove(this.player);

				let track = document.createElement("track");
				track.kind = "subtitles";
				track.label = subtitle.displayName;
				track.srclang = subtitle.language;
				track.src = `subtitle/${subtitle.slug.replace(".srt", ".vtt")}`;
				track.classList.add("subtitle_container");
				track.default = true;
				track.onload = () =>
				{
					this.player.textTracks[0].mode = "showing";
				};
				this.player.appendChild(track);
			}
		}
	}

	getSupportedFeature(feature: string) : string
	{
		if (!this.supportList)
			return "help";
		switch (feature)
		{
			case "container":
				return this.supportList.container ? "check_circle" : "cancel";
			case "video":
				return this.supportList.videoCodec ? "check_circle" : "cancel";
			case "audio":
				return this.supportList.audioCodec ? "check_circle" : "cancel";
			default:
				return "help";
		}
	}

	removeHtmlTrack()
	{
		let elements = this.player.getElementsByTagName("track");
		if (elements.length > 0)
			elements.item(0).remove();
	}

	getThumb(url: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
	}

	@HostListener("document:keyup", ["$event"])
	keypress(event: KeyboardEvent): void
	{
		switch (event.key)
		{
			case " ":
				this.togglePlayback();
				break;

			case "ArrowUp":
				this.volume += 5;
				this.snackBar.open(`${this.volume}%`, null, {
					verticalPosition: "top",
					horizontalPosition: "right",
					duration: 300,
					panelClass: "volume"
				});
				break;
			case "ArrowDown":
				this.volume += 5;
				this.snackBar.open(`${this.volume}%`, null, {
					verticalPosition: "top",
					horizontalPosition: "right",
					duration: 300,
					panelClass: "volume"
				});
				break;

			case "V":
				const subtitleIndex: number = this.item.subtitles.indexOf(this.selectedSubtitle);
				const nextSub: Track = subtitleIndex + 1 <= this.item.subtitles.length
					? this.item.subtitles[subtitleIndex + 1]
					: this.item.subtitles[0];
				this.selectSubtitle(nextSub);
				break;

			case "F":
				this.fullscreen();
				break;

			case "M":
				this.muted = !this.muted;
				this.snackBar.open(this.player.muted ? "Sound muted." : "Sound unmuted", null, {
					verticalPosition: "top",
					horizontalPosition: "right",
					duration: 750,
					panelClass: "info-panel"
				});
				break;

			case "N":
				this.next();
				break;

			case "P":
				this.previous();
				break;

			default:
				break;
		}
	}
}
