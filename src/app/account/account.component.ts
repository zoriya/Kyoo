import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Account} from "../../models/account";


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent 
{
	constructor(public dialogRef: MatDialogRef<AccountComponent>, @Inject(MAT_DIALOG_DATA) public account: Account) {}

	cancel() 
	{
		this.dialogRef.close();
	}
}
