import { Component, OnInit } from '@angular/core';
import { WatchItem } from "../../models/watch-item";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { Location } from "@angular/common";

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit
{
  item: WatchItem;

  hours: number;
  minutes: number;
  seconds: number;

  playIcon: string = "pause"; //Icon used by the play btn.
  fullscreenIcon: string = "fullscreen"; //Icon used by the fullscreen btn.

  private player: HTMLVideoElement;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private location: Location) { }

  ngOnInit()
  {
    document.getElementById("nav").classList.add("d-none");
    this.route.data.subscribe((data) =>
    {
      this.item = data.item;

      if (this.player)
      {
        this.player.load();
        this.initPlayBtn();
      }
    });
    console.log("Init");
  }

  ngAfterViewInit()
  {
    this.player = document.getElementById("player") as HTMLVideoElement;
    this.player.controls = false;

    this.player.onplay = () =>
    {
      this.initPlayBtn();
    }

    this.player.onpause = () =>
    {
      this.playIcon = "play_arrow"
      $("#play").attr("data-original-title", "Play").tooltip("show");
    }

    this.player.ontimeupdate = () =>
    {
      this.seconds = Math.round(this.player.currentTime % 60);
      this.minutes = Math.round(this.player.currentTime / 60);
    };


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

    $('[data-toggle="tooltip"]').tooltip();
  }

  ngOnDestroy()
  {
    document.getElementById("nav").classList.remove("d-none");
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

  initPlayBtn()
  {
    this.playIcon = "pause";
    $("#play").attr("data-original-title", "Pause").tooltip("show");
  }

  fullscreen()
  {
    if (document.fullscreenElement == null)
      document.getElementById("root").requestFullscreen();
    else
      document.exitFullscreen();
  }


  getThumb(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }
}
