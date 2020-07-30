export interface Page<T>
{
	this: string
	next: string
	first: string
	count: number
	items: T[]
}