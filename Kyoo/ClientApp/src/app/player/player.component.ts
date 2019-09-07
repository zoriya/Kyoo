import { Component, OnInit, ViewChild } from '@angular/core';
import { WatchItem } from "../../models/watch-item";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Location } from "@angular/common";
import { MatSliderChange } from "@angular/material/slider";
import { HtmlAstPath } from "@angular/compiler";

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit
{
  item: WatchItem;

  volume: number = 100;
  seeking: boolean = false;

  hours: number;
  minutes: number;
  seconds: number;

  maxHours: number;
  maxMinutes: number;
  maxSeconds: number;

  playIcon: string = "pause"; //Icon used by the play btn.
  volumeIcon: string = "volume_up"; //Icon used by the volume btn.
  fullscreenIcon: string = "fullscreen"; //Icon used by the fullscreen btn.

  private player: HTMLVideoElement;
  private thumb: HTMLElement;
  private progress: HTMLElement;
  private buffered: HTMLElement;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private location: Location, private title: Title) { }

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

      this.maxSeconds = Math.round(this.item.duration % 60);
      this.maxMinutes = Math.round(this.item.duration / 60 % 60);
      this.maxHours = Math.round(this.item.duration / 3600);

      this.title.setTitle(this.item.showTitle + " S" + this.item.seasonNumber + ":E" + this.item.episodeNumber + " - Kyoo");
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
      $("#play").attr("data-original-title", "Play");
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
    };

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
    });

    document.addEventListener("fullscreenchange", () =>
    {
      if (document.fullscreenElement != null)
      {
        this.fullscreenIcon = "fullscreen_exit";
        $("#fullscreen").attr("data-original-title", "Exit fullscreen").tooltip("show");
      }
      else
      {
        this.fullscreenIcon = "fullscreen";
        $("#fullscreen").attr("data-original-title", "Fullscreen").tooltip("show");
      }
    });

    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
  }

  getTimeFromSeekbar(progressBar: HTMLElement, pageX: number)
  {
    return Math.max(0, Math.min((pageX - progressBar.offsetLeft) / progressBar.clientWidth, 1)) * this.item.duration;
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
    document.getElementById("nav").classList.remove("d-none");
    this.title.setTitle("Kyoo");
  }

  back()
  {
    this.location.back();
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
    $("#play").attr("data-original-title", "Pause");
  }

  fullscreen()
  {
    if (document.fullscreenElement == null)
      document.getElementById("root").requestFullscreen();
    else
      document.exitFullscreen();
  }

  changeVolume(event: MatSliderChange)
  {
    this.player.muted = false;
    this.player.volume = event.value / 100;
    this.volume = event.value;

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


  getThumb(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }
}
