import {AbstractControl, NG_VALIDATORS, Validator} from "@angular/forms";
import {Directive} from "@angular/core";

@Directive({
	selector: "[passwordValidator]",
	providers: [{provide: NG_VALIDATORS, useExisting: PasswordValidator, multi: true}]
})
export class PasswordValidator implements Validator 
{
	validate(control: AbstractControl): {[key: string]: any} | null 
	{
		if (!control.value)
			return null;
		if (!/[a-z]/.test(control.value))
			return {"passwordError": {error: "The password must contains a lowercase letter."}};
		if (!/[A-Z]/.test(control.value))
			return {"passwordError": {error: "The password must contains an uppercase letter."}};
		if (!/[0-9]/.test(control.value))
			return {"passwordError": {error: "The password must contains a digit."}};
		if (!/\W/.test(control.value))
			return {"passwordError": {error: "The password must contains a non-alphanumeric character."}};
		if (control.value.toString().length < 6)
			return {"passwordError": {error: "Password must be at least 6 character long."}};
		return null;
	}
}