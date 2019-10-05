import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Event, ActivatedRoute, Router, NavigationStart } from "@angular/router";
import { Track, WatchItem } from "../../models/watch-item";

declare var SubtitleManager: any;

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnInit
{
  item: WatchItem;

  volume: number = 100;
  seeking: boolean = false;
  videoHider;
  controllerHovered: boolean = false;
  selectedSubtitle: Track;

  hours: number;
  minutes: number = 0;
  seconds: number = 0;

  maxHours: number;
  maxMinutes: number;
  maxSeconds: number;

  playIcon: string = "pause"; //Icon used by the play btn.
  volumeIcon: string = "volume_up"; //Icon used by the volume btn.
  fullscreenIcon: string = "fullscreen"; //Icon used by the fullscreen btn.

  playTooltip: string = "Pause"; //Text used in the play tooltip
  fullscreenTooltip: string = "Fullscreen"; //Text used in the fullscreen tooltip

  private player: HTMLVideoElement;
  private thumb: HTMLElement;
  private progress: HTMLElement;
  private buffered: HTMLElement;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private snackBar: MatSnackBar, private title: Title, private router: Router) { }

  ngOnInit()
  {
    document.getElementById("nav").classList.add("d-none");
    this.route.data.subscribe((data) =>
    {
      this.item = data.item;
      this.item.duration = 20 * 60;

      if (this.player)
      {
        this.player.load();
        this.initPlayBtn();
      }

      this.setDuration(this.item.duration);

      this.title.setTitle(this.item.showTitle + " S" + this.item.seasonNumber + ":E" + this.item.episodeNumber + " - Kyoo");

      if (this.player)
        this.init();
    });
  }

  ngAfterViewInit()
  {
    this.player = document.getElementById("player") as HTMLVideoElement;
    this.thumb = document.getElementById("thumb") as HTMLElement;
    this.progress = document.getElementById("progress") as HTMLElement;
    this.buffered = document.getElementById("buffered") as HTMLElement;
    this.player.controls = false;
    //console.log(this.player.volume * 100);
    //this.volume = this.player.volume * 100;
    //this.changeVolumeBtn();

    this.player.onplay = () =>
    {
      this.initPlayBtn();
    }

    this.player.onpause = () =>
    {
      this.playIcon = "play_arrow"
      this.playTooltip = "Play";
    }

    this.player.ontimeupdate = () =>
    {
      if (!this.seeking)
        this.updateTime(this.player.currentTime);
    };

    this.player.onprogress = () =>
    {
      if (this.player.buffered.length > 0)
        this.buffered.style.width = (this.player.buffered.end(this.player.buffered.length - 1) / this.item.duration * 100) + "%";

      if (this.player.duration != undefined && this.player.duration != Infinity)
        this.setDuration(this.player.duration);
    };

    let loadIndicator: HTMLElement = document.getElementById("loadIndicator") as HTMLElement;
    this.player.onwaiting = () =>
    {
      loadIndicator.classList.remove("d-none");
    }

    this.player.oncanplay = () =>
    {
      loadIndicator.classList.add("d-none");
    }

    this.player.onended = () =>
    {
      this.router.navigate(["/watch/" + this.item.nextEpisode.link], { queryParamsHandling: "merge" });
    }

    let progressBar: HTMLElement = document.getElementById("progress-bar") as HTMLElement;
    $(progressBar).click((event) =>
    {
      event.preventDefault();
      let time: number = this.getTimeFromSeekbar(progressBar, event.pageX);
      this.player.currentTime = time;
      this.updateTime(time);
    });

    $(progressBar).mousedown((event) =>
    {
      event.preventDefault();
      this.seeking = true;
      progressBar.classList.add("seeking");
      this.player.pause();

      let time: number = this.getTimeFromSeekbar(progressBar, event.pageX);
      this.updateTime(time);
    });

    $(document).mouseup((event) =>
    {
      if (this.seeking)
      {
        event.preventDefault();
        this.seeking = false;
        progressBar.classList.remove("seeking");

        let time: number = this.getTimeFromSeekbar(progressBar, event.pageX);
        this.player.currentTime = time;
        this.player.play();
      }
    });

    $(document).mousemove((event) =>
    {
      if (this.seeking)
      {
        let time: number = this.getTimeFromSeekbar(progressBar, event.pageX);
        this.updateTime(time);
      }
      else
      {
        document.getElementById("hover").classList.remove("idle");
        document.documentElement.style.cursor = "";

        clearTimeout(this.videoHider);

        this.videoHider = setTimeout((ev: MouseEvent) =>
        {
          if (!this.player.paused && !this.controllerHovered)
          {
            document.getElementById("hover").classList.add("idle");
            document.documentElement.style.cursor = "none";
          }
        }, 2000);
      }
    });

    $("#controller").mouseenter(() => { this.controllerHovered = true; });
    $("#controller").mouseleave(() => { this.controllerHovered = false; });

    //Initialize the timout at the document initialization.
    this.videoHider = setTimeout(() =>
    {
      if (!this.player.paused)
      {
        document.getElementById("hover").classList.add("idle");
        document.documentElement.style.cursor = "none";
      }
    }, 1000);

    document.addEventListener("fullscreenchange", () =>
    {
      if (document.fullscreenElement != null)
      {
        this.fullscreenIcon = "fullscreen_exit";
        this.fullscreenTooltip = "Exit fullscreen";
      }
      else
      {
        this.fullscreenIcon = "fullscreen";
        this.fullscreenTooltip = "Fullscreen";
      }
    });

    $(window).keydown((e) =>
    {
      switch (e.keyCode)
      {
        case 32: //space
          this.tooglePlayback();
          break;

        case 38: //Key up
          this.changeVolume(this.volume + 5);
          this.snackBar.open(this.volume + "%", null, { verticalPosition: "top", horizontalPosition: "right", duration: 300, panelClass: "volume" });
          break;
        case 40: //Key down
          this.changeVolume(this.volume - 5);
          this.snackBar.open(this.volume + "%", null, { verticalPosition: "top", horizontalPosition: "right", duration: 300, panelClass: "volume" });
          break;

        case 86: //V key
          let subtitleIndex: number = this.item.subtitles.indexOf(this.selectedSubtitle);
          let nextSub: Track;
          if (subtitleIndex + 1 <= this.item.subtitles.length)
            nextSub = this.item.subtitles[subtitleIndex + 1];
          else
            nextSub = this.item.subtitles[0];

          this.selectSubtitle(nextSub);
          break;

        case 70: //F key
          this.fullscreen();
          break;

        case 77: //M key
          this.toogleMute();
          if (this.player.muted)
            this.snackBar.open("Sound muted.", null, { verticalPosition: "top", horizontalPosition: "right", duration: 750, panelClass: "info-panel" });
          else
            this.snackBar.open("Sound unmuted.", null, { verticalPosition: "top", horizontalPosition: "right", duration: 750, panelClass: "info-panel" });
          break;

        case 78: //N key
          this.router.navigate(["/watch/" + this.item.nextEpisode.link], { queryParamsHandling: "merge" });
          break;

        case 80: //P key
          if (this.item.previousEpisode != null)
            this.router.navigate(["/watch/" + this.item.previousEpisode], { queryParamsHandling: "merge" });
          break;

        default:
          break;
      }
    });

    this.router.events.subscribe((event: Event) =>
    {
      switch (true)
      {
        case event instanceof NavigationStart:
        {
          loadIndicator.classList.remove("d-none");
          break;
        }
        default:
          break;
      }
    });

    this.init();
  }

  init()
  {
    //Load sub selected from the url.
    let sub: string = this.route.snapshot.queryParams["sub"];
    if (sub != null)
    {
      let languageCode: string = sub.substring(0, 3);
      let forced: boolean = sub.length > 3 && sub.substring(4) == "for";

      this.selectSubtitle(this.item.subtitles.find(x => x.language == languageCode && x.isForced == forced), false);
    }

    setTimeout(() =>
    {
      this.snackBar.open("Playing: " + this.item.showTitle + " S" + this.item.seasonNumber + ":E" + this.item.episodeNumber, null, { verticalPosition: "top", horizontalPosition: "right", duration: 2000, panelClass: "info-panel" });
    }, 750);
  }

  getTimeFromSeekbar(progressBar: HTMLElement, pageX: number)
  {
    return Math.max(0, Math.min((pageX - progressBar.offsetLeft) / progressBar.clientWidth, 1)) * this.item.duration;
  }

  setDuration(duration: number)
  {
    this.maxSeconds = Math.round(duration % 60);
    this.maxMinutes = Math.round(duration / 60 % 60);
    this.maxHours = Math.round(duration / 3600);

    this.item.duration = duration;
  }

  updateTime(time: number)
  {
    this.hours = Math.round(time / 60 % 60);
    this.seconds = Math.round(time % 60);
    this.minutes = Math.round(time / 60);

    this.thumb.style.transform = "translateX(" + (time / this.item.duration * 100) + "%)";
    this.progress.style.width = (time / this.item.duration * 100) + "%";
  }

  ngOnDestroy()
  {
    if (document.fullscreen)
      document.exitFullscreen();

    document.getElementById("nav").classList.remove("d-none");
    this.title.setTitle("Kyoo");

    $(document).unbind();
    $(window).unbind();
  }

  tooglePlayback()
  {
    if (this.player.paused)
      this.player.play();
    else
      this.player.pause();
  }

  toogleMute()
  {
    if (this.player.muted)
      this.player.muted = false;
    else
      this.player.muted = true;

    this.updateVolumeBtn()
  }

  initPlayBtn()
  {
    this.playIcon = "pause";
    this.playTooltip = "Pause";
  }

  fullscreen()
  {
    if (document.fullscreenElement == null)
      document.body.requestFullscreen();
    else
      document.exitFullscreen();
  }

  //Value from 0 to 100
  changeVolume(value: number)
  {
    value = Math.max(0, Math.min(value, 100));

    this.player.muted = false;
    this.player.volume = value / 100;
    this.volume = value;

    this.updateVolumeBtn();
  }

  updateVolumeBtn()
  {
    if (this.player.muted)
    {
      this.volumeIcon = "volume_off"
    }
    else
    {
      if (this.volume == 0)
        this.volumeIcon = "volume_off";
      else if (this.volume < 25)
        this.volumeIcon = "volume_mute";
      else if (this.volume < 65)
        this.volumeIcon = "volume_down";
      else
        this.volumeIcon = "volume_up";
    }
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

      this.router.navigate([], { relativeTo: this.route, queryParams: { sub: subSlug }, replaceUrl: true, queryParamsHandling: "merge" });
    }

    this.selectedSubtitle = subtitle;

    if (subtitle == null)
    {
      this.snackBar.open("Subtitle removed.", null, { verticalPosition: "top", horizontalPosition: "right", duration: 750, panelClass: "info-panel" });
      SubtitleManager.remove(this.player);
      this.removeHtmlTrack();
    }
    else
    {
      this.snackBar.open(subtitle.displayName + " subtitle loaded.", null, { verticalPosition: "top", horizontalPosition: "right", duration: 750, panelClass: "info-panel" });
      this.removeHtmlTrack();

      if (subtitle.codec == "ass")
        SubtitleManager.add(this.player, subtitle.link, true);

      else if (subtitle.codec == "subrip")
      {
        SubtitleManager.remove(this.player);

        let track = document.createElement("track");
        track.kind = "subtitles";
        track.label = subtitle.displayName;
        track.srclang = subtitle.language;
        track.src = subtitle.link.replace(".srt", ".vtt");
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

  getThumb(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }
}
