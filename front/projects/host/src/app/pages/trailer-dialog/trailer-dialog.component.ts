import { AfterViewInit, Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Component({
  selector: "app-trailer-dialog",
  templateUrl: "./trailer-dialog.component.html",
  styleUrls: ["./trailer-dialog.component.scss"]
})
export class TrailerDialogComponent implements AfterViewInit
{
	constructor(public dialogRef: MatDialogRef<TrailerDialogComponent>,
	            public sanitizer: DomSanitizer,
	            @Inject(MAT_DIALOG_DATA) public trailer: string)
	{}

	getYtTrailer(): string
	{
		if (!this.trailer.includes("youtube.com"))
			return null;
		const ytID: string = this.trailer.substring(this.trailer.indexOf("watch?v=") + 8);
		return `https://www.youtube.com/embed/${ytID}?autoplay=1`;
	}

	ngAfterViewInit(): void
	{
		const frame = <HTMLIFrameElement>document.getElementById("frame")
		frame.src = this.getYtTrailer();
	}
}
