using System;

namespace Kyoo.Models.Exceptions
{
	public class DuplicatedItemException : Exception
	{
		public override string Message { get; }

		public DuplicatedItemException(string message)
		{
			Message = message;
		}
	}
}