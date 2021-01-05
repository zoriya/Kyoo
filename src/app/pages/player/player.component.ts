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
import { ShowService } from "../../services/api.service";
import { StartupService } from "../../services/startup.service";
import {
	getWhatIsSupported,
	method,
	SupportList
} from "./playbackMethodDetector";
import { AppComponent } from "../../app.component";
import { Track, WatchItem } from "../../models/watch-item";
import SubtitlesOctopus from "libass-wasm/dist/js/subtitles-octopus.js"


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

@Pipe({
	name: "volumeToButton",
	pure: true
})
export class VolumeToButtonPipe implements PipeTransform
{
	transform(volume: number, muted: boolean): string
	{
		if (volume == 0 || muted)
			return "volume_off";
		else if (volume < 25)
			return "volume_mute";
		else if (volume < 65)
			return "volume_down";
		else
			return "volume_up";
	}
}

@Pipe({
	name: "supportedButton",
	pure: true
})
export class SupportedButtonPipe implements PipeTransform
{
	transform(supports: SupportList, selector: string, audioIndex: number = 0): string
	{
		if (!supports)
			return "help";
		switch (selector)
		{
			case "container":
				return supports.container ? "check_circle" : "cancel";
			case "video":
				return supports.videoCodec ? "check_circle" : "cancel";
			case "audio":
				return supports.audioCodec[audioIndex] ? "check_circle" : "cancel";
			default:
				return "help";
		}
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
	selectedAudio: number = 0;
	selectedSubtitle: number = -1;
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
	isMenuOpen: boolean = false;
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
				this.showControls = this.player.paused || this.areControlHovered || this.isMenuOpen;
			}, 2500);
		}
		else
			this.controlHider = null;
	}

	methodType = method;
	displayStats: boolean = false;


	private subtitlesManager: SubtitlesOctopus;
	private hlsPlayer: Hls = new Hls();
	private oidcSecurity: OidcSecurityService;
	constructor(private route: ActivatedRoute,
	            private sanitizer: DomSanitizer,
	            private snackBar: MatSnackBar,
	            private title: Title,
	            private router: Router,
	            private location: Location,
	            private injector: Injector,
	            private shows: ShowService,
	            private startup: StartupService)
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
					this.loading = true;
					break;
				case event instanceof NavigationEnd:
				case event instanceof NavigationCancel:
					this.loading = false;
					break;
				default:
					break;
			}
		});
	}

	ngOnDestroy()
	{
		if (this.subtitlesManager)
			this.subtitlesManager.dispose();
		if (this.isFullScreen)
			document.exitFullscreen();

		document.getElementById("nav").classList.remove("d-none");
		this.title.setTitle("Kyoo");

		$(document).off();
	}

	ngAfterViewInit()
	{
		if (this.oidcSecurity === undefined)
			this.oidcSecurity = this.injector.get(OidcSecurityService);
		this.hlsPlayer.config.xhrSetup = xhr =>
		{
			const token = this.oidcSecurity.getToken();
			if (token)
				xhr.setRequestHeader("Authorization", "Bearer " + token);
		};

		this.showControls = true;

		setTimeout(() => this.route.data.subscribe(() =>
		{
			// TODO remove the query param for the method (should be a session setting).
			let queryMethod: string = this.route.snapshot.queryParams["method"];
			this.supportList = getWhatIsSupported(this.player, this.item);
			this.selectPlayMethod(queryMethod ? method[queryMethod] : this.supportList.getPlaybackMethod());

			// TODO remove this, it should be a user's setting.
			const subSlug: string = this.route.snapshot.queryParams["sub"];
			if (subSlug != null)
			{
				const languageCode: string = subSlug.substring(0, 3);
				const forced: boolean = subSlug.length > 3 && subSlug.substring(4) == "for";
				const sub: Track = this.item.subtitles.find(x => x.language == languageCode && x.isForced == forced);
				this.selectSubtitle(sub, false);
			}
		}));
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
		else if (!AppComponent.isMobile)
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
		const url: string = `/video/${this.playMethod.toLowerCase()}/${this.item.slug}/`;
		if (this.playMethod == method.direct || this.player.canPlayType("application/vnd.apple.mpegurl"))
			this.player.src = url;
		else
		{
			this.hlsPlayer.loadSource(url);
			this.hlsPlayer.attachMedia(this.player);
			this.hlsPlayer.on(Hls.Events.MANIFEST_LOADED, () =>
			{
				this.player.play();
			});
		}
	}

	back()
	{
		if (this.startup.loadedFromWatch)
		{
			this.router.navigate(["show", this.startup.show], {replaceUrl: true})
			this.startup.loadedFromWatch = false;
			this.startup.show = null;
		}
		else
			this.location.back();
	}

	next()
	{
		if (this.item.nextEpisode == null)
			return;
		this.router.navigate(["/watch", this.item.nextEpisode.slug], {
			queryParamsHandling: "merge",
			replaceUrl: true
		});
	}

	previous()
	{
		if (this.item.previousEpisode == null)
			return;
		this.router.navigate(["/watch", this.item.previousEpisode.slug], {
			queryParamsHandling: "merge",
			replaceUrl: true
		});
	}

	videoClicked()
	{
		if (AppComponent.isMobile)
			this.showControls = !this.showControls;
		else
		{
			this.showControls = !this.player.paused;
			this.togglePlayback();
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
		if (this.isFullScreen)
			document.exitFullscreen();
		else
			document.body.requestFullscreen();
	}

	async selectSubtitle(subtitle: Track | number, changeUrl: boolean = true)
	{
		if (typeof(subtitle) === "number")
		{
			this.selectedSubtitle = subtitle;
			subtitle = this.item.subtitles[subtitle];
		}
		else
			this.selectedSubtitle = this.item.subtitles.indexOf(subtitle);

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
				queryParamsHandling: "merge",
			});
		}


		if (subtitle == null)
		{
			this.snackBar.open("Subtitle removed.", null, {
				verticalPosition: "top",
				horizontalPosition: "right",
				duration: 750,
				panelClass: "info-panel"
			});
			if (this.subtitlesManager)
				this.subtitlesManager.freeTrack();
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
			{
				if (!this.subtitlesManager)
				{
					let fonts: {[key: string]: string} = await this.shows.getFonts(this.item.showSlug).toPromise();
					this.subtitlesManager = new SubtitlesOctopus({
						video: this.player,
						subUrl: `subtitle/${subtitle.slug}`,
						fonts: Object.values(fonts)
					});
				}
				else
					this.subtitlesManager.setTrackByUrl(`subtitle/${subtitle.slug}`);
			}
			else if (subtitle.codec == "subrip")
			{
				if (this.subtitlesManager)
					this.subtitlesManager.freeTrack();

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

	removeHtmlTrack()
	{
		let elements = this.player.getElementsByTagName("track");
		if (elements.length > 0)
			elements.item(0).remove();
	}

	@HostListener("document:keyup", ["$event"])
	keypress(event: KeyboardEvent): void
	{
		switch (event.key)
		{
			case " ":
			case "k":
			case "K":
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

			case "v":
			case "V":
				this.selectSubtitle((this.selectedSubtitle + 2) % (this.item.subtitles.length + 1) - 1);
				break;

			case "f":
			case "F":
				this.fullscreen();
				break;

			case "m":
			case "M":
				this.muted = !this.muted;
				this.snackBar.open(this.player.muted ? "Sound muted." : "Sound unmuted", null, {
					verticalPosition: "top",
					horizontalPosition: "right",
					duration: 750,
					panelClass: "info-panel"
				});
				break;

			case "n":
			case "N":
				this.next();
				break;

			case "p":
			case "P":
				this.previous();
				break;

			default:
				break;
		}
	}
}
