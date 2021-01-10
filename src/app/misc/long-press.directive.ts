import { Directive, Output, EventEmitter, HostListener, HostBinding, ElementRef } from "@angular/core";
import MouseDownEvent = JQuery.MouseDownEvent;
import TouchStartEvent = JQuery.TouchStartEvent;

function cancelClick(event): void
{
	console.log("Cancel click")
	event.preventDefault();
	event.stopPropagation();
	this.removeEventListener("click", cancelClick, true);
}

@Directive({
	selector: `[appLongPress]`
})
export class LongPressDirective
{
	@Output() longPressed = new EventEmitter();
	private _timer: NodeJS.Timeout = null;

	constructor(private ref: ElementRef) {}

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
			// We must use the nativeElement ref and can't use a HostListener
			// since Angular does not support capture phase listener.
			// TODO this is used for firefox since firefox still trigger a click event
			// FIXME find the best way to make it work for all, use a cancelclick like
			//  so or find a way to prevent the event from ever happenning.
			this.ref.nativeElement.addEventListener("click", cancelClick, true);
		}, 500);
	}

	@HostListener("touchend", ["$event"])
	@HostListener("mouseup", ["$event"])
	end(): void
	{
		console.log("test");
		// TODO this timeout is for chrome, chrome do not output a click event so the cancelClick should be removed.
		// FIXME Chrome does not trigger a touchend event ether. So this is never called.
		setTimeout(() =>
		{
			console.log("Timeout");
			this.ref.nativeElement.removeEventListener("click", cancelClick, true);
		}, 50);
		this.cancel();
	}

	@HostListener("wheel", ["$event"])
	@HostListener("scroll", ["$event"])
	@HostListener("document.scroll", ["$event"])
	@HostListener("window.scroll", ["$event"])
	cancel(): void
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
