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
  video: string;

  playIcon: string = "pause"; //Icon used by the play btn.
  fullscreenIcon: string = "fullscreen"; //Icon used by the fullscreen btn.

  private player: HTMLVideoElement;

  constructor(private route: ActivatedRoute, private location: Location)
  {
    this.video = this.route.snapshot.paramMap.get("item");
  }

  ngOnInit()
  {
    document.getElementById("nav").classList.add("d-none");
    this.item = this.route.snapshot.data.item;
    console.log("Init");
  }

  ngAfterViewInit()
  {
    this.player = document.getElementById("player") as HTMLVideoElement;
    this.player.controls = false;

    $('[data-toggle="tooltip"]').tooltip();

    document.addEventListener("fullscreenchange", (event) =>
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
    let playBtn: HTMLElement = document.getElementById("play");

    if (this.player.paused)
    {
      this.player.play();

      this.playIcon = "pause"
      $(playBtn).attr("data-original-title", "Pause").tooltip("show");
    }
    else
    {
      this.player.pause();

      this.playIcon = "play_arrow"
      $(playBtn).attr("data-original-title", "Play").tooltip("show");
    }
  }

  fullscreen()
  {
    if (document.fullscreenElement == null)
      document.getElementById("root").requestFullscreen();
    else
      document.exitFullscreen();
  }
}
