import { Directive, Output, EventEmitter, HostListener, HostBinding } from "@angular/core";
import MouseDownEvent = JQuery.MouseDownEvent;
import TouchStartEvent = JQuery.TouchStartEvent;
import MouseMoveEvent = JQuery.MouseMoveEvent;
import TouchMoveEvent = JQuery.TouchMoveEvent;

@Directive({
	selector: `[appLongPress]`
})
export class LongPressDirective
{
	@Output() longPressed = new EventEmitter();
	private _timer: NodeJS.Timeout = null;

	@HostBinding('class.longpress')
	get longPress(): boolean
	{
		return this._timer !== null;
	}

	@HostListener("touchstart", ["$event"])
	@HostListener("mousedown", ["$event"])
	start(event: MouseDownEvent | TouchStartEvent): void
	{
		const startBox = event.target.getBoundingClientRect();
		this._timer = setTimeout(() =>
		{
			const endBox = event.target.getBoundingClientRect();
			if (startBox.top !== endBox.top || startBox.left !== endBox.left)
				return;
			this.longPressed.emit();
			this._timer = null;
		}, 500);
	}

	@HostListener("touchend", ["$event"])
	@HostListener("mouseup", ["$event"])
	@HostListener("wheel", ["$event"])
	@HostListener("scroll", ["$event"])
	@HostListener("document.scroll", ["$event"])
	@HostListener("window.scroll", ["$event"])
	end(): void
	{
		clearTimeout(this._timer);
		this._timer = null;
	}

	@HostListener("contextmenu", ["$event"])
	context(event): void
	{
		event.preventDefault();
	}

	@HostBinding("style.-webkit-touch-callout")
	defaultLongTouchEvent: string = "none";
}
