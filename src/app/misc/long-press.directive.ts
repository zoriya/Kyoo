import { Directive, Output, EventEmitter, HostListener, HostBinding } from "@angular/core";

@Directive({
	selector: `[appLongPress]`
})
export class LongPressDirective
{
	@Output() longPressed = new EventEmitter();
	timer: NodeJS.Timeout = null;

	@HostBinding('class.longpress')
	get longPress(): boolean
	{
		return this.timer !== null;
	}

	@HostListener("touchstart", ["$event"])
	@HostListener("mousedown", ["$event"])
	start(): void
	{
		this.timer = setTimeout(() => {
			this.longPressed.emit();
		}, 500);
	}

	@HostListener("touchend", ["$event"])
	@HostListener("mouseup", ["$event"])
	end(): void
	{
		clearTimeout(this.timer);
		this.timer = null;
	}

	@HostListener("contextmenu", ["$event"])
	context(event): void
	{
		event.preventDefault();
	}

	@HostBinding("style.-webkit-touch-callout")
	defaultLongTouchEvent: string = "none";

}
