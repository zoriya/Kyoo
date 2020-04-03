import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-trailer-dialog',
  templateUrl: './trailer-dialog.component.html',
  styleUrls: ['./trailer-dialog.component.scss']
})
export class TrailerDialogComponent 
{
	constructor(public dialogRef: MatDialogRef<TrailerDialogComponent>, public sanitizer: DomSanitizer,  @Inject(MAT_DIALOG_DATA) public trailer: string) {}

	getYtTrailer()
	{
		if (!this.trailer.includes("youtube.com"))
			return null;
		let uri = "https://www.youtube.com/embed/" + this.trailer.substring(this.trailer.indexOf("watch?v=") + 8) + "?autoplay=1";
		return this.sanitizer.bypassSecurityTrustResourceUrl(uri);
	}
}
