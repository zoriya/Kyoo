import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpClient} from "@angular/common/http";
import {Account} from "../../models/account";


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent 
{
	selectedPicture: File;
	@ViewChild("accountImg") accountImg: ElementRef;
	
	constructor(public dialogRef: MatDialogRef<AccountComponent>,
	            @Inject(MAT_DIALOG_DATA) public account: Account,
	            private http: HttpClient) {}

	finish()
	{
		let data = new FormData();
		data.append("email", this.account.email);
		data.append("username", this.account.username);
		data.append("picture", this.selectedPicture);
		
		this.http.post("api/account/update", data).subscribe(() =>
		{
			this.dialogRef.close(this.account);
		});
	}
	
	cancel() 
	{
		this.dialogRef.close();
	}

	onPictureSelected(event: any)
	{
		this.selectedPicture = event.target.files[0];
		const reader = new FileReader();
		reader.onloadend = () => 
		{
			this.accountImg.nativeElement.src = reader.result;
		};
		reader.readAsDataURL(this.selectedPicture);
	}
}
