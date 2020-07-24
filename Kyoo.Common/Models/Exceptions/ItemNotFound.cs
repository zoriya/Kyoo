using System;

namespace Kyoo.Models.Exceptions
{
	public class ItemNotFound : Exception
	{
		public override string Message { get; }

		public ItemNotFound() {}
		
		public ItemNotFound(string message)
		{
			Message = message;
		}
	}
}