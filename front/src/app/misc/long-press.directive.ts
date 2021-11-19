import { Directive, Output, EventEmitter, HostListener, HostBinding, ElementRef } from "@angular/core";
import MouseDownEvent = JQuery.MouseDownEvent;
import TouchStartEvent = JQuery.TouchStartEvent;
import ContextMenuEvent = JQuery.ContextMenuEvent;
import ClickEvent = JQuery.ClickEvent;

function cancelClick(event: ClickEvent): void
{
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

	@HostBinding("style.-webkit-touch-callout")
	defaultLongTouchEvent: string = "none";

	@HostBinding("class.longpress")
	get longPress(): boolean
	{
		return this._timer !== null;
	}

	@HostListener("touchstart", ["$event"])
	@HostListener("mousedown", ["$event"])
	start(event: MouseDownEvent | TouchStartEvent): void
	{
		const startBox: DOMRect = event.target.getBoundingClientRect();
		this._timer = setTimeout(() =>
		{
			const endBox: DOMRect = event.target.getBoundingClientRect();
			if (startBox.top !== endBox.top || startBox.left !== endBox.left)
				return;
			this.longPressed.emit();
			this._timer = null;
			this.ref.nativeElement.addEventListener("click", cancelClick, true);
		}, 500);
	}

	@HostListener("touchend", ["$event"])
	@HostListener("window:mouseup", ["$event"])
	end(): void
	{
		setTimeout(() =>
		{
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
	context(event: ContextMenuEvent): void
	{
		event.preventDefault();
	}
}
